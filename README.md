# Fero’s Brain Booster

Webová aplikácia na tréning vizuálnej pozornosti sledovaním viacerých objektov v perspektívnom 3D priestore. Nezávislý projekt bez prepojenia na NeuroTracker. Nejde o stereoskopické zobrazenie ani zdravotnícku pomôcku.

## Spustenie

Vyžaduje Node.js 22.12+ (alebo novší podporovaný Node).

```sh
npm ci
npm run dev
```

## Používanie

Zapamätaj si zelené gule, počas pohybu sleduj ich polohu a po zastavení ich označ. Klikni na gule alebo použi klávesy 1–8. Enter potvrdí výber / spustí ďalšie kolo, medzerník pozastaví tréning. Pri prepnutí na inú kartu sa tréning automaticky pozastaví.

Nastavenia: 2–5 cieľov z 8 gúľ, 6/8/12 sekúnd pohybu, 5/10/20 kôl, počiatočná rýchlosť. Po úplne správnom kole rýchlosť stúpne o 12 %, po chybe klesne o 12 %. Rozsah 0.20–3.00×. Toto je vlastná jednoduchá adaptácia, nie skórovací algoritmus NeuroTrackeru.

Výsledky dokončených tréningov zostávajú v localStorage daného prehliadača. Vymazanie údajov prehliadača vymaže aj históriu. Žiadny server ani používateľský účet. Fonty sa načítavajú z Google Fonts s lokálnym systémovým fallbackom.

## Overenie a zostavenie

```sh
npm test
npm run build
npm run preview
```

Priečinok `dist/` je možné publikovať na statickom hostingu. Relatívne cesty podporujú aj GitHub Pages pod cestou repozitára.

## GitHub Pages

Workflow `.github/workflows/deploy.yml` testuje a zostavuje aplikáciu pri pushi do `main`, potom ju publikuje na GitHub Pages. V nastaveniach repozitára v Pages nastav zdroj na **GitHub Actions**. Pri verejnom repozitári je Pages dostupné aj na bezplatnom pláne; dostupnosť pre súkromné repozitáre závisí od plánu GitHubu.
