from sqlalchemy import create_engine

# Singleton design
class DatabaseConfiguration:
    instance = None

    # Để sau __init__ thì nó gọi __new__ trả đúng 1 instance, that is a singleton
    def __new__(cls, *args, **kwargs):
        if not cls.instance:
            cls.instance = super().__new__(cls)
        return cls.instance

    def __init__(self, username, password, host, port, database, dialect, driver, more=""):
        """
                URL format: dialect+driver://username:password@host:port/database

        :param username:
        :param password:
        :param host:
        :param port:
        :param database:
        :param dialect:
        :param driver:
        :param more:
        """
        self.dialect = dialect
        self.driver = driver
        self.username = username
        self.password = password
        self.host = host
        self.port = port
        self.database = database
        self.more = more

    @classmethod
    def get_instance(cls):
        return cls.instance

    def url(self):
        """
        URL format: dialect+driver://username:password@host:port/database
        :return:
        """
        return f"{self.dialect}+{self.driver}://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}{self.more}"

    def get_connection(self):
        try:
            engine = create_engine(self.url())
            print(f"Created database engine {self.host} for user {self.user} successfully")
            return engine
        except Exception as ex:
            raise ValueError("Could not be made engine due to the following error:\n", ex)




if __name__ == '__main__':
    db_instance = DatabaseConfiguration(
        "notworle",
        '123',
        "ep-twilight-cake-a1gvkakf-pooler.ap-southeast-1.aws.neon.tech",
        5432,
        "face_recognition",
        "postgresql",
        "psycopg2",
        more="?sslmode=require"
    )
