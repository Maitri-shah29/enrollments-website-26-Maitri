# SFU zero-drop deploy (single VM, Docker host networking)

This setup runs two SFU containers side-by-side and uses Redis to remember
which SFU owns each room. New rooms go to the active SFU; existing rooms stay
on the old one until they end.

## Prereqs

- Docker + Docker Compose
- Open these ports on the VM:
  - TCP: 3031, 3032
  - UDP: 40000-41000, 41001-42000

## Environment

Add these to your app environment (for the Next server):

```
REDIS_URL=redis://127.0.0.1:6379
SFU_POOL=sfu-a=http://127.0.0.1:3031,sfu-b=http://127.0.0.1:3032
```

For the SFU containers:

```
ANNOUNCED_IP=<your VM public IP>
SFU_SECRET=<same secret used by the app>
```

## Start Redis + two SFUs

```
docker compose -f docker-compose.sfu.yml up -d --build
```

## One-command deploy on the VM

From the repo root on the VM:

```
scripts/deploy-sfu.sh
```

This script:

- runs `git pull`
- installs SFU deps (`sfu/`)
- brings up Redis
- builds the inactive SFU
- drains the active SFU
- waits for rooms to reach zero
- rebuilds the previously active SFU

## Draining during deploy

When you deploy a new SFU version, start the new container and then mark the
old one as draining. Draining blocks new room creation but keeps existing
rooms alive.

```
curl -X POST http://<vm-ip>:3031/drain \
  -H "x-sfu-secret: <SFU_SECRET>" \
  -H "content-type: application/json" \
  -d '{"draining": true}'
```

Verify status:

```
curl -H "x-sfu-secret: <SFU_SECRET>" http://<vm-ip>:3031/status
```

When the old SFU reports `rooms: 0`, you can stop it.

## Notes

- Host networking is required for reliable WebRTC UDP ports in Docker.
- Each SFU must have a distinct UDP port range.
- The allocator keeps a room bound to the same SFU as long as the room exists.
