#!/usr/bin/env bash
# Avisa Bing, Yandex e outros buscadores (IndexNow) que estas URLs mudaram. Uso: bash ferramentas/indexnow.sh URL [URL...]
KEY=d654cb594517091c1bea14b0ab867407
for u in "$@"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://api.indexnow.org/indexnow?url=$(printf %s "$u" | sed 's/:/%3A/g;s#/#%2F#g')&key=$KEY&keyLocation=https%3A%2F%2Foferta.infinityguard.com.br%2F$KEY.txt")
  echo "IndexNow $code $u"
done
