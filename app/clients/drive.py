# app/google_drive.py
from typing import Optional, List
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError
import os, io
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
# Scopes mínimos: subir/bajar y gestionar archivos creados por la app
SCOPES = ["https://www.googleapis.com/auth/drive.file"]
# Si quieres gestionar TODO (y/o eliminar archivos que ya existían), usa:
# SCOPES = ["https://www.googleapis.com/auth/drive"]
def get_drive_service_user(
    client_secret_path: str,
    token_path: str = "token.json",
):
    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())  # opcional: from google.auth.transport.requests import Request
        else:
            flow = InstalledAppFlow.from_client_secrets_file(client_secret_path, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_path, "w") as f:
            f.write(creds.to_json())

    return build("drive", "v3", credentials=creds)

def ensure_folder_path(service, parts, parent_id=None):
    def _find(name, mime, parent):
        escaped_name = name.replace("'", "\\'")
        q = [f"name = '{escaped_name}'", "trashed = false"]
        if parent:
            q.append(f"'{parent}' in parents")
        if mime:
            q.append(f"mimeType = '{mime}'")
        res = service.files().list(q=" and ".join(q), fields="files(id,name)").execute()
        items = res.get("files", [])
        return items[0] if items else None

    folder_mime = "application/vnd.google-apps.folder"
    cur = parent_id
    for p in parts:
        ex = _find(p, folder_mime, cur)
        if ex:
            cur = ex["id"]
        else:
            body = {"name": p, "mimeType": folder_mime}
            if cur:
                body["parents"] = [cur]
            cur = service.files().create(body=body, fields="id").execute()["id"]
    return cur


def upload_file_to_folder(service, file_stream, filename, mimetype, folder_id):
    media = MediaIoBaseUpload(file_stream, mimetype=mimetype or "application/octet-stream", resumable=True)
    meta = {"name": filename, "parents": [folder_id]}
    return service.files().create(
        body=meta, media_body=media,
        fields="id,name,webViewLink,webContentLink"
    ).execute()


def get_drive_service_from_sa(sa_json_path: str):
    """
    Inicializa el cliente con Service Account.
    Si necesitas que los archivos queden en 'My Drive' de un usuario,
    habilita Domain-Wide Delegation y usa subject=... en Credentials.
    """
    creds = service_account.Credentials.from_service_account_file(
        sa_json_path, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)

def _find_item(service, name: str, mime_type: Optional[str], parent_id: Optional[str]) -> Optional[dict]:
    """Busca un archivo/carpeta por nombre en un parent dado (no recursivo)."""
    q = []
    if parent_id:
        q.append(f"'{parent_id}' in parents")
    q.append("name = '{}'".format(name.replace('"', '\\"')))
    if mime_type:
        q.append(f"mimeType = '{mime_type}'")
    q.append("trashed = false")
    query = " and ".join(q)

    res = service.files().list(
        q=query,
        fields="files(id,name,mimeType,webViewLink,webContentLink,parents)"
    ).execute()
    files = res.get("files", [])
    return files[0] if files else None

def ensure_folder_path2(service, path_parts: List[str], parent_id: Optional[str] = None) -> str:
    """
    Crea (si no existe) la ruta de carpetas en Drive y devuelve el folder_id final.
    path_parts: e.g. ["insurance_policies", "user_123"]
    """
    current_parent = parent_id
    for part in path_parts:
        existing = _find_item(service, part, "application/vnd.google-apps.folder", current_parent)
        if existing:
            current_parent = existing["id"]
        else:
            meta = {
                "name": part,
                "mimeType": "application/vnd.google-apps.folder",
                **({"parents": [current_parent]} if current_parent else {})
            }
            created = service.files().create(body=meta, fields="id").execute()
            current_parent = created["id"]
    return current_parent  # folder_id final

def upload_file_to_folder2(service, file_stream, filename: str, mimetype: str, folder_id: str):
    """Sube el archivo a una carpeta por ID y devuelve metadata (id, links)."""
    media = MediaIoBaseUpload(file_stream, mimetype=mimetype, resumable=True)
    file_metadata = {"name": filename, "parents": [folder_id]}
    created = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id,name,webViewLink,webContentLink,iconLink,thumbnailLink"
    ).execute()
    return created  # dict

def make_anyone_with_link_viewer(service, file_id: str):
    """(Opcional) Haz el archivo accesible por link (solo lectura)."""
    perm = {
        "type": "anyone",
        "role": "reader",
    }
    return service.permissions().create(fileId=file_id, body=perm).execute()

def delete_file(service, file_id: str):
    service.files().delete(fileId=file_id).execute()