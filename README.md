# TechNest

Django project.

## Local setup

From the folder containing `manage.py`, run:

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

For local development, Django uses a non-secret fallback key. Set `DJANGO_SECRET_KEY`
to a private, randomly generated value for any shared or deployed environment.
Do not commit secret keys, `.env` files, or the local SQLite database.
