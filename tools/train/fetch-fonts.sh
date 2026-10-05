#!/usr/bin/env bash
# Downloads the Culmus Hebrew fonts (GPL-2 with a font exception) into fonts/.
# They are used only to render synthetic training images and are not committed.
set -euo pipefail
cd "$(dirname "$0")"
VERSION=0.140
mkdir -p fonts
tmp=$(mktemp -d)
curl -sSL -o "$tmp/culmus.tar.gz" "https://downloads.sourceforge.net/project/culmus/culmus/$VERSION/culmus-$VERSION.tar.gz"
tar xzf "$tmp/culmus.tar.gz" -C "$tmp"
for f in StamAshkenazCLM.ttf StamSefaradCLM.ttf KeterYG-Medium.ttf KeterYG-Bold.ttf FrankRuehlCLM-Medium.otf FrankRuehlCLM-Bold.otf \
         DavidCLM-Medium.otf DrugulinCLM-Bold.otf HadasimCLM-Regular.otf HadasimCLM-Bold.otf ShofarRegular.ttf ShofarDemi-Bold.ttf \
         SimpleCLM-Medium.ttf MiriamCLM-Book.otf NachlieliCLM-Bold.otf YehudaCLM-Bold.otf; do
  cp "$tmp/culmus-$VERSION/$f" fonts/
done
cp "$tmp/culmus-$VERSION/LICENSE" fonts/LICENSE-culmus
rm -rf "$tmp"
ls fonts
