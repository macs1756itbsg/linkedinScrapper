

import fs from "fs"


const readUsers = () => {
  return JSON.parse(fs.readFileSync('./users/index.json', 'utf8'))
}

const users = readUsers()

const target = users.filter(u => Boolean(u.companyName))


fs.writeFileSync('./users/part.json', JSON.stringify(target, null, 2));