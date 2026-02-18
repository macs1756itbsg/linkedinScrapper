import fs from "fs"


const r = () => {
  return JSON.parse(fs.readFileSync('./users/linkedin.json', 'utf8'))
}

const add = (ex) => {
  fs.writeFileSync('./users/2.json', JSON.stringify([ex], null, 2));
};

const users = r()

const target = users.map(e => ({
  firstName: e.firstName,
  lastName: e.lastName,
  jobTitle: e.jobTitle,
  organization: e.organization,
  linkedinAccount: e?.linkedinAccount ?? e?.linkedin,
}))


add(target)