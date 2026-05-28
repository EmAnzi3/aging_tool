# Aging Tool - GitHub Pages

Applicazione statica per generare tre report Excel partendo da:

- `Aging_Clienti.xlsx`
- `Aging_Filiale.xlsx`
- `Mesi.xlsx`

Output generati:

- `Aging Clienti.xlsx`
- `Aging Filiale.xlsx`
- `Clienti Dormienti e Persi.xlsx`
- `Report_Aging.zip` con i tre file insieme

## Come pubblicare su GitHub Pages

1. Crea un repository, per esempio `aging-tool`.
2. Copia in root questi file e cartelle:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `vendor/jszip.min.js`
   - `.nojekyll`
3. Fai commit e push.
4. In GitHub vai su **Settings > Pages**.
5. Source: `Deploy from a branch`.
6. Branch: `main`, folder `/root`.
7. Apri il link pubblicato da GitHub Pages.

## Nota privacy

I file Excel vengono letti ed elaborati nel browser dell'utente. Non vengono caricati su GitHub, non vengono salvati nel repository e non vengono inviati a un backend.

## Nota tecnica

La logica replica gli script Python presenti nello zip originale. In particolare, per i report Aging il saldo totale viene ricostruito leggendo la colonna T delle righe totali con cella in grassetto.

Prima della diffusione a tutte le filiali è consigliato confrontare gli output generati dalla pagina con quelli prodotti dagli script Python sui file campione.
