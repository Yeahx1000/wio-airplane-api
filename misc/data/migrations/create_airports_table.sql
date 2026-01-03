CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE
    IF NOT EXISTS airports (
        id INTEGER PRIMARY KEY,
        airport_name VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        country VARCHAR(255) NOT NULL,
        iata_faa VARCHAR(3),
        icao VARCHAR(4),
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        altitude INTEGER NOT NULL,
        timezone VARCHAR(255) NOT NULL,
        location GEOMETRY (POINT, 4326) NOT NULL
    );

CREATE INDEX IF NOT EXISTS idx_airports_location ON airports USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_airports_country ON airports (country);

CREATE INDEX IF NOT EXISTS idx_airports_iata_faa ON airports (iata_faa)
WHERE
    iata_faa IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_airports_icao ON airports (icao)
WHERE
    icao IS NOT NULL;