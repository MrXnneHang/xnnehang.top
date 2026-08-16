---
title: 'Termix: A Very Cool Web-Based SSH Client'
published: 2025-12-29
category: Tutorials
tags:
  - Tutorial
  - Docker
  - SSH
  - Termix
description: 'A Termix deployment guide: use Docker to host a web-based SSH client and finally say goodbye to Termius acting up.'
image: ../../assets/img/covers/202512291044412.png
lang: en
translationKey: termix-web-ssh-guide
---

## Preface

A few days ago, my roommate showed me a Termius-like application deployed on the web. I was amazed: it is very full-featured, supports SFTP with both uploads and downloads, closely copies the Termius visual design, and can run on a local port for browser access.

Repository:

https://github.com/Termix-SSH/Termix

Deploying it publicly brings several conveniences:

- When changing to a new device or operating system, you do not need to struggle with installing software or look up IP addresses and passwords again.
- You can use someone else's device without leaving traces behind.
- Most importantly, you do not have to worry about Termius occasionally going rogue and uninstalling itself.

I have used the SSH connection in BaoTa Panel and Termius. No need to mention the one bundled with the cloud provider; I am sick of scanning QR codes for Tencent Cloud servers.

At first, Termius feels beautifully designed. I could spend half a day playing with terminal-style choices alone, and its UI elements are modern, elegant, and pleasant to look at. That is why I kept using it. But as mentioned above, it sometimes goes rogue and uninstalls itself, clearing every cache in the process, so every machine has to be imported again.

Of course, there is a paradox here. If the server hosting my Termix has an internal error and Termix stops working, I still need Termius to connect. There is no escaping that.

A case of liking the new and abandoning the old.

Let us start deploying it.

## A very simple local deployment

If you have used Docker and Docker Compose before, deployment is very easy. If not, wait a moment while I briefly cover installing Docker and Docker Compose.

### Preparation: installing Docker and Docker Compose

First, install some required packages:

> If the system is too old, you can upgrade it with `apt upgrade`, although for a new machine I recommend reinstalling directly.

```shell
apt update
apt install curl vim wget gnupg dpkg apt-transport-https lsb-release ca-certificates
```

Then add Docker's GPG public key and APT repository:

```shell
curl -sSL https://download.docker.com/linux/debian/gpg | gpg --dearmor > /usr/share/keyrings/docker-ce.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-ce.gpg] https://download.docker.com/linux/debian $(lsb_release -sc) stable" > /etc/apt/sources.list.d/docker.list
```

For machines in mainland China, you can use the Tsinghua TUNA mirror:

```shell
curl -sS https://download.docker.com/linux/debian/gpg | gpg --dearmor > /usr/share/keyrings/docker-ce.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-ce.gpg] https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian $(lsb_release -sc) stable" > /etc/apt/sources.list.d/docker.list
```

Update the package list, then install Docker CE:

```shell
apt install docker-ce docker-ce-cli containerd.io
```

We can install the latest Docker Compose version directly from Docker's official GitHub release:

```shell
curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-Linux-x86_64 > /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

You can now run `docker-compose version` to confirm that it installed successfully.

### Deployment

In a directory where you want to keep it, for example `/opt/termix`, create `compose.yml`:

```yaml
services:
  termix:
    image: ghcr.io/lukegus/termix:latest
    container_name: termix
    restart: unless-stopped
    ports:
      - '8080:8080'
    volumes:
      - termix-data:/app/data
    environment:
      PORT: '8080'

volumes:
  termix-data:
    driver: local
```

Then pull the image:

```shell
root@ser351791695801:/opt/termix# docker compose pull
[+] pull 19/19
 ✔ Image ghcr.io/lukegus/termix:latest Pulled
```

Finally, run the image:

```shell
root@ser351791695801:/opt/termix# docker compose up
[+] up 3/3
 ✔ Network termix_default    Created
 ✔ Volume termix_termix-data Created
 ✔ Container termix          Created
Attaching to termix
termix  | Configuring web UI to run on port: 8080
termix  | SSL disabled - using HTTP-only configuration (default)
termix  | Starting nginx...
termix  | Starting backend services...
termix  | [7:35:12 AM] [INFO] Termix Backend starting - Version: 1.9.0
```

If no errors appear, press Ctrl+C to stop it, then run it in the background:

```shell
root@ser351791695801:/opt/termix# docker compose up -d
[+] up 1/1
 ✔ Container termix Running
```

The application will then stay alive when the terminal closes.

> I was curious why some people write `compose.yml`, some write `compose.yaml`, and some write `docker-compose.yml`. They all seem to be recognized by `docker compose pull`.

Gemini reminded me that it searches for them automatically according to a priority order:

![Compose-file lookup order](../../assets/img/covers/202512291042933.png)

This also avoids conflicts when there is more than one Compose file.

## Public deployment

Here I will only demonstrate the approach I use most often: a 1Panel reverse proxy.

1Panel installation: https://1panel.cn/

- Install OpenResty from the 1Panel app store.
- Create a DNS A record that points to the server's public IP address.
- Create a reverse-proxy website for `127.0.0.1:8080`.
- Apply for a certificate, which requires binding a DNS account.

![Add a DNS account](../../assets/img/covers/202512291043494.png)

When applying for the certificate, select the option to skip DNS verification:

![Apply for a certificate](../../assets/img/covers/202512291043854.png)

Finally, enable HTTPS for the site and select the certificate for the corresponding domain:

![Enable HTTPS](../../assets/img/covers/202512291043299.png)

The only thing to remember is to **save**.

## Screenshots

After that, you can access it directly from the public internet.

![Sign-in screen](../../assets/img/covers/202512291044412.png)

![System information panel](../../assets/img/covers/202512291055872.png)

![Terminal](../../assets/img/covers/202512291055842.png)

![SFTP](../../assets/img/covers/202512291057168.png)

It is worth trying, and I really like this UI too. A visual-design enthusiast is here.

See you next time =-=//
