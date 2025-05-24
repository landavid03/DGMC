import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from app import db
from app.config import get_config

class DatabaseClient:
    """Client for database operations"""

    def __init__(self, app=None):
        self.engine = None
        self.session_factory = None
        self.Session = None

        if app:
            self.init_app(app)

    def init_app(self, app):
        """Initialize with Flask app"""
        config = get_config()

        # Use the database URI from the app's config
        database_uri = app.config['SQLALCHEMY_DATABASE_URI']

        # Create engine
        self.engine = create_engine(database_uri)

        # Create session factory
        self.session_factory = sessionmaker(bind=self.engine)

        # Create scoped session
        self.Session = scoped_session(self.session_factory)

    def get_session(self):
        """Get a database session"""
        if not self.Session:
            raise RuntimeError("Database client not initialized")
        return self.Session()
