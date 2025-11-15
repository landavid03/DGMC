gsutil -m rm -r gs://dgmc-frontend

gsutil mb gs://dgmc-frontend

npm run build

gsutil -m cp -r build gs://dgmc-frontend

gsutil -m acl ch -r -u AllUsers:R gs://dgmc-frontend

