import os
import uuid
from datetime import datetime
from google.cloud import storage
from werkzeug.utils import secure_filename

class CloudStorageClient:
    """Client for Google Cloud Storage operations"""

    def __init__(self, app=None):
        self.client = None
        self.bucket = None
        self.bucket_name = None

        if app:
            self.init_app(app)

    def init_app(self, app):
        """Initialize with Flask app"""
        # Set credentials file path from app config
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = app.config['GOOGLE_APPLICATION_CREDENTIALS']

        # Initialize storage client
        self.client = storage.Client()

        # Get bucket name from app config
        self.bucket_name = app.config['GCS_BUCKET_NAME']

        # Get or create bucket
        try:
            self.bucket = self.client.get_bucket(self.bucket_name)
        except Exception:
            # Create bucket if it doesn't exist
            self.bucket = self.client.create_bucket(self.bucket_name)

    def upload_file(self, file_obj, folder='', allowed_extensions=None):
        """
        Upload a file to Google Cloud Storage

        Args:
            file_obj: File object to upload
            folder: Folder to upload to (optional)
            allowed_extensions: List of allowed file extensions (optional)

        Returns:
            Cloud Storage path of the uploaded file
        """
        if not self.client or not self.bucket:
            raise RuntimeError("Cloud Storage client not initialized")

        # Check if file is allowed
        if allowed_extensions:
            original_filename = secure_filename(file_obj.filename)
            file_ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
            if file_ext not in allowed_extensions:
                raise ValueError(f"File extension '{file_ext}' not allowed")

        # Generate a unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        original_filename = secure_filename(file_obj.filename)
        filename = f"{timestamp}_{unique_id}_{original_filename}"

        # Create full path
        if folder:
            path = f"{folder}/{filename}"
        else:
            path = filename

        # Upload file
        blob = self.bucket.blob(path)
        blob.upload_from_file(file_obj)

        # Make the file publicly accessible
        blob.make_public()

        return blob.public_url

    def delete_file(self, file_path):
        """
        Delete a file from Google Cloud Storage

        Args:
            file_path: Path of the file to delete
        """
        if not self.client or not self.bucket:
            raise RuntimeError("Cloud Storage client not initialized")

        # Extract blob name from full path or URL
        if 'https://' in file_path:
            # Extract the path from the URL
            blob_name = file_path.split(f"{self.bucket_name}/")[1]
        else:
            # Use the path directly
            blob_name = file_path

        # Delete file
        blob = self.bucket.blob(blob_name)
        blob.delete()

    def generate_signed_url(self, file_path, expiration=3600):
        """
        Generate a signed URL for a file

        Args:
            file_path: Path of the file
            expiration: Expiration time in seconds (default: 1 hour)

        Returns:
            Signed URL for the file
        """
        if not self.client or not self.bucket:
            raise RuntimeError("Cloud Storage client not initialized")

        # Extract blob name from full path or URL
        if 'https://' in file_path:
            # Extract the path from the URL
            blob_name = file_path.split(f"{self.bucket_name}/")[1]
        else:
            # Use the path directly
            blob_name = file_path

        # Generate signed URL
        blob = self.bucket.blob(blob_name)
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(seconds=expiration),
            method="GET"
        )

        return url
