## GitHub Flow

### 1. Hämta senaste main
`git checkout main`
`git pull origin origin`

### 2. Skapa ny branch
`git checkout -b <branch-name>`

### 3. Commit, push (regelbundet)
`git add .`
`git commit -m "Commit msg"`
`git push -u origin <branch-name>`

### 4. Håll branch uppdaterad (efter nya merges på main)
`git rebase origin main`

### 5. Skapa PR → review → merge
Hoppa över review om du inte vill ha feedback

### 6. Ta bort branchen från github (via GUI)
Allt är sparat i commithistoriken i main

### 7. Ta eventuellt bort branchen lokalt
`git branch -d <branch-name>`
