# Resend Domain Verification - DNS Records per `outreach.zakstudio.com`

Per inviare email REALI a prospect (non solo test), devi verificare il dominio `outreach.zakstudio.com` su Resend.

## 1. Vai su Resend Dashboard
https://resend.com/domains

## 2. Aggiungi dominio `outreach.zakstudio.com`

## 3. Aggiungi questi 4 record DNS nel pannello del tuo provider DNS (Cloudflare, GoDaddy, ecc.)

| Tipo | Nome | Valore | TTL |
|------|------|--------|-----|
| **TXT** | `@` | `v=spf1 include:_spf.resend.com ~all` | Auto |
| **TXT** | `resend._domainkey` | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...` (da Resend) | Auto |
| **CNAME** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@zakstudio.com` | Auto |
| **MX** | `@` | `10 feedback-smtp.eu-west-1.amazonses.com` | Auto |

**Nota**: Il valore DKIM (`p=...`) viene generato da Resend quando aggiungi il dominio. Copialo esattamente.

## 4. Verifica su Resend
Clicca "Verify" su Resend. Ci mette fino a 48h (solitamente < 1h).

## 5. Dopo verifica - aggiorna dispatcher.yaml
```yaml
esp:
  provider: "resend"
  resend:
    api_key_env: "RESEND_API_KEY"
    domain: "outreach.zakstudio.com"
    test_mode: false   # IMPOSTA FALSE
```

## 6. Test invio reale
```bash
python sender_daemon.py --dry-run
# Se tutto OK, rimuovi --dry-run per invio reale
```

---

## ✅ Checklist produzione completa

- [ ] 1. Push repo su GitHub
- [ ] 2. Aggiungi **30+ GitHub Secrets** (copia da `.env` → GitHub Repo Settings → Secrets)
- [ ] 3. Verifica dominio Resend (4 record DNS sopra) → `outreach.zakstudio.com` verde su Resend
- [ ] 4. Configura AgentMail webhook: `https://zakstudio-webhook-deploy.vercel.app/api/webhooks/email/agentmail`
- [ ] 5. Configura Resend webhook: `https://zakstudio-webhook-deploy.vercel.app/api/webhooks/email/resend`
- [ ] 6. (Opzionale) IMAP per auto-payment: metti `IMAP_ENABLED=true` + credenziali Gmail App Password
- [ ] 7. Test end-to-end: aggiungi un lead test su foglio → run step 1-7 manualmente