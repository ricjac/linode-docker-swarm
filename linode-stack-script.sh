#!/bin/bash
apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce

# TODO: Configure docker:
#   - file overlay
#   - gen certs

# JS Docker lib: https://github.com/apocas/dockerode

# https://docs.docker.com/engine/security/https/
# /lib/systemd/system/docker.service
# ExecStart=/usr/bin/dockerd -H fd://
# ExecStart=/usr/bin/dockerd --tlsverify --tlscacert=ca.pem --tlscert=server-cert.pem --tlskey=server-key.pem -H=0.0.0.0:2376