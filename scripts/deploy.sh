#!/usr/bin/env bash
# Corre EN EL SERVIDOR: /opt/stuvgraph/scripts/deploy.sh <tag>
set -euo pipefail
cd /opt/stuvgraph
TAG="${1:?uso: deploy.sh <tag>}"
COMPOSE="docker compose -f compose.prod.yaml"
PREV="$(cat .current_tag 2>/dev/null || true)"

export IMAGE_TAG="$TAG"
echo ">> pull $TAG"
$COMPOSE pull app web

echo ">> migraciones"
$COMPOSE run --rm app php artisan migrate --force --isolated

echo ">> up"
if ! $COMPOSE up -d --remove-orphans --wait --wait-timeout 240; then
  echo "!! deploy fallido"
  $COMPOSE logs --tail=80 app web || true
  if [ -n "$PREV" ] && [ "$PREV" != "$TAG" ]; then
    echo ">> rollback a $PREV (las migraciones NO se revierten: deben ser compatibles hacia atras)"
    IMAGE_TAG="$PREV" $COMPOSE up -d --remove-orphans --wait --wait-timeout 240 || true
  fi
  exit 1
fi

echo "$TAG" > .current_tag
docker image prune -f --filter "until=168h" >/dev/null
echo ">> OK $TAG"