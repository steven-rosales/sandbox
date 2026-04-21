## Docker crash sheet for WSL Ubuntu (Bash)

### 1) Check Docker is working

```bash
docker version
docker info
docker context ls
docker compose version
```

If Docker is installed correctly in WSL, these should return info instead of connection errors.

---

### 2) Most-used commands

#### Images

```bash
docker images
docker pull postgres:18.3
docker build -t myapp .
docker rmi myapp
```

#### Containers

```bash
docker ps
docker ps -a
docker run hello-world
docker stop <container>
docker start <container>
docker restart <container>
docker rm <container>
```

#### Logs

```bash
docker logs <container>
docker logs -f <container>
docker compose logs
docker compose logs -f
```

#### Exec into container

```bash
docker exec -it <container> bash
docker exec -it <container> sh
```

---

### 3) Docker Compose basics

Run from the folder containing `docker-compose.yml` or `compose.yml`.

```bash
docker compose up
docker compose up -d
docker compose down
docker compose down -v
docker compose ps
docker compose restart
docker compose logs -f
```

### Important

```bash
docker compose -f logs
```

is wrong.

Use:

```bash
docker compose logs -f
```

Use `-f` only when specifying a compose file:

```bash
docker compose -f docker-compose.yml up -d
```

---

### 4) WSL/Bash path examples

#### Current folder mount

```bash
docker run --rm -it -v "$PWD":/app -w /app ubuntu bash
```

#### Mount a Linux path

```bash
docker run --rm -it -v /home/steven/project:/app ubuntu bash
```

#### Mount a Windows drive inside WSL

```bash
docker run --rm -it -v /mnt/c/Users/Steven/project:/app ubuntu bash
```

For WSL, Linux filesystem paths usually behave better than Windows-mounted paths for performance.

---

### 5) Postgres example for your setup

```yaml
services:
  db:
    image: postgres:18.3
    container_name: sandbox
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: sandbox
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql

volumes:
  pgdata:
```

Start it:

```bash
docker compose up -d
docker compose logs -f
```

Stop it:

```bash
docker compose down
```

Delete container + volume:

```bash
docker compose down -v
```

---

### 6) Fix for your Postgres 18 volume issue

If you **do not need old data**:

```bash
docker compose down -v
docker compose up -d
docker compose logs -f
```

If the volume still exists:

```bash
docker volume ls
docker volume rm sandbox_pgdata
docker compose up -d
```

---

### 7) Inspect what is happening

```bash
docker ps -a
docker inspect sandbox
docker stats
docker top sandbox
```

---

### 8) Enter Postgres container

```bash
docker exec -it sandbox bash
```

Open psql directly:

```bash
docker exec -it sandbox psql -U postgres -d sandbox
```

---

### 9) Clean up Docker

```bash
docker container prune
docker image prune
docker volume prune
docker system prune
docker system prune -a
```

Be careful with:

```bash
docker system prune -a
```

It removes a lot.

---

### 10) Useful Bash shortcuts

#### Stop all running containers

```bash
docker stop $(docker ps -q)
```

#### Remove all stopped containers

```bash
docker rm $(docker ps -aq)
```

#### Remove all images

```bash
docker rmi $(docker images -q)
```

#### Follow logs for one container

```bash
docker logs -f sandbox
```

#### Show only running container IDs

```bash
docker ps -q
```

---

### 11) Quick troubleshooting

#### “Cannot connect to the Docker daemon”

```bash
docker info
```

If this fails in WSL, Docker Desktop may not be running or WSL integration may be off.

#### Container keeps restarting

```bash
docker ps
docker ps -a
docker logs -f <container>
```

#### Compose changes not applied

```bash
docker compose down
docker compose up -d
```

#### Need to rebuild image

```bash
docker compose build
docker compose up -d
```

Or:

```bash
docker compose up -d --build
```

---

### 12) Good mental model

* **image** = template
* **container** = running instance
* **volume** = persistent data
* **compose** = multi-container launcher

---

### 13) Tiny daily workflow

```bash
cd ~/sandbox
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
```

