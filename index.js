const { Client } = require('discord.js');
const client = new Client();
const fs = require('fs');
const usersFile = './users.json';

client.on('guildMemberAdd', (member) => {
  if (member.guild.id === '965887092825686066') {
    const users = JSON.parse(fs.readFileSync(usersFile));
    if (!users.includes(member.id)) { // Check if user ID doesn't already exist in the users file
      users.push(member.id);
      fs.writeFileSync(usersFile, JSON.stringify(users));
      const inviter = findInviter(member);
      if (inviter) { // Check if there's a valid inviter
        const invites = member.guild.fetchInvites()
                           .then(invites => invites)
                           .catch(err => console.log(err));
        invites.then((invites) => {
          const oldInvite = invites.find(invite => invite.uses < (invite.maxUses || 0) && 
                                                     invite.inviter.id === inviter.id && 
                                                     invite.guild.id === member.guild.id);
          if (oldInvite) { // Check if the invite exists and is valid
            inviter.inviteUses += 1; // Increment the invite count for the inviter
            if (inviter.inviteUses >= 2) { // Check if the inviter has invited at least 2 people
              const padash = inviter.inviteUses * 500000;
              member.guild.channels.cache.get('1100834941035614270').send(`تبریک فردی با آیدی ${inviter.id} شما دوستان خود را دعوت کردید و ${padash} امتیاز دریافت کردید`);
              inviter.inviteUses = 0; // Reset the invite count for the inviter
              fs.writeFileSync(usersFile, JSON.stringify(users));
            }
          } else {
            // Send a message to the admin channel saying the invite was not found or invalid
            member.guild.channels.cache.get('1100834941035614270').send(`${inviter} شما ${member} را دعوت کردید اما به دلیل اینکه قبلا در سرور عضو بوده یا تاریخ ساخت حساب آن کمتر از حد قابل قبول بوده حساب نشد`);
          }
        });
      }}
  }
});

function findInviter(member) {
  const invites = member.guild.fetchInvites()
                         .then(invites => invites)
                         .catch(err => console.log(err));
  invites.then((invites) => {
    const userInvites = invites.filter(invite => invite.inviter.id === member.id);
    for (const invite of userInvites) {
      const { uses, maxUses, inviter } = invite;
      if ((maxUses == null || uses < maxUses) && inviter.id !== member.id) {
        return inviter;
      }
    }
    return null; // If inviter is not found or is the member himself/herself
  });
}

client.on('guildMemberRemove', (member) => {
  const users = JSON.parse(fs.readFileSync(usersFile));
  const inviter = findInviter(member);
  if (inviter) {
    inviter.inviteUses -= 1;
    fs.writeFileSync(usersFile, JSON.stringify(users));
  }
});

client.on('ready', () => {
  setInterval(() => {
    const users = JSON.parse(fs.readFileSync(usersFile));
    for (const userId of users) {
      const member = client.guilds.cache.get('965887092825686066').members.cache.get(userId);
      if (member) {
        const inviter = findInviter(member);
        if (inviter && inviter.inviteUses >= 2) {
          const padash = inviter.inviteUses * 500000;
          member.guild.channels.cache.get('1100834941035614270').send(`تبریک فردی با آیدی ${inviter.id} شما دوستان خود را دعوت کردید و ${padash} امتیاز دریافت کردید`);
          inviter.inviteUses = 0;
          fs.writeFileSync(usersFile, JSON.stringify(users));
        }
      }
    }
  }, 60000);
});

client.login(token);
