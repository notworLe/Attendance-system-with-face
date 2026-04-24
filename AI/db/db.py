import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
DB_PASSWORD = os.getenv("DB_PASSWORD")

import uuid
# from sqlalchemy import create_engine, text, MetaData, Table, Column, String, ARRAY, Float, select, update
# from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import text, MetaData, Column, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import DeclarativeBase

class Face(DeclarativeBase):
    __tablename__ = "face"

    # Internal: auto increment for DB performance
    id = Column(Integer, primary_key=True, autoincrement=True)


    public_id = Column(UUID(as_uuid=True), unique=True, default=uuid.uuid4())

# Singleton design
class DatabaseConfiguration:
    instance = None

    # Để sau __init__ thì nó gọi __new__ trả đúng 1 instance, that is a singleton
    def __new__(cls, *args, **kwargs):
        if not cls.instance:
            cls.instance = super().__new__(cls)
        return cls.instance

    def __init__(self, user, password, host, port, database, dialect, driver, more=""):
        self.user = user
        self.password = password
        self.host = host
        self.port = port
        self.database = database
        self.dialect = dialect
        self.driver = driver
        self.more = more

    @classmethod
    def get_instance(cls):
        return cls.instance

    def url(self):
        """
        URL format: dialect+driver://username:password@host:port/database
        :return:
        """
        return f"{self.dialect}+{self.driver}://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}{self.more}"

    def get_connection(self):
        try:
            engine = create_engine(self.url())
            print(f"Created database engine {self.host} for user {self.user} successfully")
            return engine
        except Exception as ex:
            raise ValueError("Could not be made engine due to the following error:\n", ex)



db_instance = DatabaseConfiguration(
        "guest",
        "npg_BF6MRWSQ5hbd",
        "ep-twilight-cake-a1gvkakf-pooler.ap-southeast-1.aws.neon.tech",
        5432,
        "face_recognition",
        "postgresql",
        "psycopg2",
        more="?sslmode=require"
    )
engine_db = db_instance.get_connection()
meta = MetaData()
meta.reflect(bind=engine_db)
face = meta.tables['face']

def update_embedding1(name, embedding):
    embedding = embedding.tolist()
    with engine_db.connect() as conn:
        # Is name existed
        is_exist = select(face).where(face.c.name == name)
        result = conn.execute(is_exist).fetchone()

        if result is None:
            stmt = face.insert().values(
                name=name,
                embedding=embedding
            )
            print("New user, added")
        else:
            stmt = face.update()\
                .where(face.c.name == name)\
                .values(embedding=embedding)
            print(f"Update: {name}")
        conn.execute(stmt)
        conn.commit()

def update_embedding2(name, embedding):
    embedding = embedding.tolist()

    with engine_db.connect() as conn:
        stmt = insert(face).values(
            name=name,
            embedding=embedding
        ).on_conflict_do_update(
            index_elements=['name'],
            set_={'embedding': embedding}
        )
        conn.execute(stmt)
        conn.commit()

def get_embedding():
    sql = text("""
        SELECT * FROM face;
    """)
    with engine_db.connect() as conn:
        result = conn.execute(sql).fetchall()
    return result

if __name__ == '__main__':
    db_instance = DatabaseConfiguration(
        "notworle",
        DB_PASSWORD,
        "ep-twilight-cake-a1gvkakf-pooler.ap-southeast-1.aws.neon.tech",
        5432,
        "face_recognition",
        "postgresql",
        "psycopg2",
        more="?sslmode=require"
    )
    # Create engine
    engine_db = db_instance.get_connection()


    # Metadata instance
    meta = MetaData()
    # Get information of tables into local
    meta.reflect(bind=engine_db)

    # Create face table
    # face = Table(
    #     'face',
    #     meta,
    #     Column("name", String, unique=True),
    #     Column("embedding", ARRAY(Float))
    # )
    # meta.create_all(engine_db)

    # Get face table
    # face_table = meta.tables['face']
    #
    #
    # all_faces = text("SELECT * FROM FACE")
    #
    # sql = face_table.delete().where(face_table.c.name == "Độ Mixi")

    # edit_table = text("""
    #     ALTER TABLE face
    #     ADD CONSTRAINT unique_name UNIQUE (name);
    # """)
    # with engine_db.connect() as conn:
    #     result = conn.execute(edit_table)
    #     conn.commit()
    # print(result)