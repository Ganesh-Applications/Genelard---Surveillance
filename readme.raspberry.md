# Attribution stable des ports USB (/dev/esp*)

Objectif :  
Associer physiquement chaque ESP connecté à un hub USB à un port série Linux constant
(`/dev/esp1`, `/dev/esp2`, etc.) afin d’éviter que `/dev/ttyACM*` change après chaque reboot.

---

## 1. Découvrir la topologie USB

Utilise la commande suivante pour connaître précisément où chaque ESP est branché :

```bash
lsusb -t
```

Exemple de sortie :

```
/:  Bus 01.Port 1: Dev 1, Class=root_hub
    |__ Port 1: Dev 3, Class=Hub
        |__ Port 1: Dev 4, Class=Hub
            |__ Port 2: Dev 10, Class=CDC ACM
            |__ Port 3: Dev 6,  Class=CDC ACM
```

🧠 Ce qui nous intéresse :
- Le numéro de bus (Bus 01)
- L’enchaînement de ports (Port 1 → Port 1 → Port 2, etc.)
- L’ordre physique réel de branchement

---

## 2. Comprendre comment Linux nomme les périphériques série

Quand tu branches un ESP, Linux lui assigne dynamiquement :
- `/dev/ttyACM0`
- `/dev/ttyUSB0`
- etc.

Mais ces noms :
- changent au reboot
- changent selon l’ordre de branchement
- sont dangereux en production

➡️ Solution : règles UDEV.

---

## 3. Principe des règles UDEV

Le noyau Linux (kernel) :
- détecte un périphérique USB
- identifie ses caractéristiques (bus, port, classe...)
- déclenche udev
- udev applique des règles
- crée le fichier `/dev/...`

Une règle peut dire :

> "Si un périphérique est branché à tel endroit précis dans l’arborescence USB,
> alors crée un alias nommé `/dev/espX`."

---

## 4. Identifier un ESP connecté

Connecte un ESP, puis cherche son port :

```bash
ls /dev/tty*
```

Puis interroge le système sur ce port :

```bash
udevadm info -a -n /dev/ttyACM0
```

Repère les lignes importantes comme :

```
KERNELS=="1-1.1.2"
```

Ce champ décrit **le chemin physique USB réel :**
```
Bus 1 → Port 1 → Hub → Port 1 → Hub → Port 2
```

---

## 5. Créer une règle udev

Crée le fichier de règles :

```bash
sudo nano /etc/udev/rules.d/99-esp.rules
```

Exemple de règles :

```udev
SUBSYSTEM=="tty", KERNELS=="1-1.1.2", SYMLINK+="esp1"
SUBSYSTEM=="tty", KERNELS=="1-1.1.3", SYMLINK+="esp2"
SUBSYSTEM=="tty", KERNELS=="1-1.1.4", SYMLINK+="esp3"
SUBSYSTEM=="tty", KERNELS=="1-1.1.5", SYMLINK+="esp4"
```

✅ Tu relies ainsi :
- une position physique USB →
- à un nom fixe `/dev/espX`

---

## 6. Recharger les règles

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Puis vérifie :

```bash
ls -l /dev/esp*
```

---

## 7. Vérification finale

Teste la communication :

```bash
screen /dev/esp1 115200
```

ou

```bash
cat /dev/esp2
```

---

## 8. Bonnes pratiques

✅ Toujours brancher :
- les ESP
- sur les mêmes ports

✅ Ne pas :
- intervertir les câbles
- changer de hub sans refaire les règles

---

## 9. Dépannage

### L’alias n’apparaît pas ?

```bash
udevadm monitor
```
Puis branche un ESP et observe.

### Mauvais port ?

Relance :

```bash
lsusb -t
udevadm info -a -n /dev/ttyACM0
```

Vérifie la valeur exacte de `KERNELS==`.

---

## 10. Résumé express

| Étape | Action |
|------|--------|
| 1 | `lsusb -t` |
| 2 | Branche un ESP |
| 3 | `udevadm info -a -n /dev/ttyACM0` |
| 4 | Récupère `KERNELS=="..."` |
| 5 | Crée règle dans `/etc/udev/rules.d/` |
| 6 | reload règles |
| 7 | `/dev/espX` prêt |

---

## 11. Résultat attendu

Tu obtiens désormais :

```
/dev/esp1
/dev/esp2
/dev/esp3
/dev/esp4
```

Stables, propres, fiables 💡

---
