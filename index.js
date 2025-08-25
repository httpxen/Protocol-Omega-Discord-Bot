const { Client, GatewayIntentBits, ActivityType, SlashCommandBuilder, EmbedBuilder, InteractionResponseType } = require('discord.js');
require('dotenv').config(); // Load environment variables

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = '!'; // Legacy prefix for non-slash commands

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Fetch initial guild members to populate cache
  try {
    const guild = client.guilds.cache.get('883342483801669653') || client.guilds.cache.first();
    if (guild) {
      await guild.members.fetch({ force: true, withPresence: false });
      console.log(`Fetched members from guild: ${guild.name} (ID: ${guild.id})`);
    } else {
      console.error('No guild found. Ensure the bot is in a server and the guild ID is correct.');
    }
  } catch (error) {
    console.error('Error fetching initial guild members:', error);
  }

  updateActivity(); // Set initial activity status

  // Register slash commands
  const commands = [
    new SlashCommandBuilder()
      .setName('online')
      .setDescription('Set bot status to Online'),
    new SlashCommandBuilder()
      .setName('idle')
      .setDescription('Set bot status to Idle'),
    new SlashCommandBuilder()
      .setName('dnd')
      .setDescription('Set bot status to Do Not Disturb'),
    new SlashCommandBuilder()
      .setName('developer')
      .setDescription('Displays information about the bot developer'),
    new SlashCommandBuilder()
      .setName('owner')
      .setDescription('Displays information about the bot owner'),
    new SlashCommandBuilder()
      .setName('memberlist')
      .setDescription('Displays a list of all non-bot members in the server'),
    new SlashCommandBuilder()
      .setName('memberinfo')
      .setDescription('Displays information about a specific member')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The member to get info about')
          .setRequired(true)
      )
  ].map(command => command.toJSON());

  try {
    await client.application.commands.set(commands);
    console.log('Slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

async function updateActivity() {
  try {
    const guild = client.guilds.cache.get('883342483801669653') || client.guilds.cache.first();
    if (!guild) {
      console.error('No guild found.');
      return;
    }

    await guild.members.fetch();
    const totalMembers = guild.members.cache.filter(member => !member.user.bot).size;
    const activeMembers = guild.members.cache.filter(
      member => !member.user.bot && member.presence?.status && ['online', 'idle', 'dnd'].includes(member.presence.status)
    ).size;

    client.user.setActivity({
      name: `[${activeMembers}/${totalMembers}] on ${guild.name}`,
      type: ActivityType.Watching
    });
    console.log(`Updated activity to: Watching [${activeMembers}/${totalMembers}] on ${guild.name}`);
  } catch (error) {
    console.error('Error updating activity:', error);
  }
}

client.on('guildMemberAdd', async member => {
  const channel = member.guild.channels.cache.find(ch => ch.name === 'general');
  if (channel) {
    channel.send(`Welcome ${member.user.username} to ${member.guild.name}! We're now ${member.guild.memberCount} strong! 🎉`);
  }
});

client.on('guildMemberRemove', async member => {
  console.log(`Member ${member.user.username} (ID: ${member.user.id}) left the server.`);
});

client.on('messageCreate', message => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'update') {
    updateActivity();
    message.reply('Member count updated! Check the bot status.');
  }
});

client.on('presenceUpdate', () => {
  updateActivity();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === 'online') {
      client.user.setPresence({ status: 'online' });
      await interaction.reply('Bot status set to **Online**!');
    } else if (commandName === 'idle') {
      client.user.setPresence({ status: 'idle' });
      await interaction.reply('Bot status set to **Idle**!');
    } else if (commandName === 'dnd') {
      client.user.setPresence({ status: 'dnd' });
      await interaction.reply('Bot status set to **Do Not Disturb**!');
    } else if (commandName === 'developer') {
      const developerData = { username: 'Xen', join_date: new Date() };

      const developerEmbed = new EmbedBuilder()
        .setTitle('Bot Developer Profile: Xen')
        .setDescription(`Meet ${developerData.username}, the developer who brought this bot to life!`)
        .addFields(
          { name: 'Name', value: developerData.username, inline: true },
          { name: 'Role', value: 'Web Dev, FiveM Dev', inline: true },
          { name: 'Joined', value: new Date(developerData.join_date).toLocaleDateString(), inline: true },
          { name: 'About', value: 'Expert in HTML, TAILWIND CSS, React.js, Bootstrap, Laravel, Lua, and Discord bot development. Dedicated to creating seamless and engaging server experiences with a focus on performance and user interaction.' },
          { name: 'Fun Fact', value: 'Enjoys coding while listening to Spotify!', inline: false },
          { 
            name: 'Social Links', 
            value: '[GitHub](https://github.com/httpxen) | [Instagram](https://www.instagram.com/drei_xen/) | [LinkedIn](https://www.linkedin.com/in/tom-andrei-opulencia-1b5b90314/)', 
            inline: false 
          }
        )
        .setColor('#ff9900')
        .setImage('https://cdn.discordapp.com/attachments/1249672084137705544/1399389644193529916/Purple_Aquamarine_Art_Pixel_Art_Discord_Profile_Banner.gif?ex=6888d2aa&is=6887812a&hm=33cd17cb3703cafad30cf98c50791ff9c66f5fd78c7259e60c4985c3049b2ce9&')
        .setThumbnail('https://media.discordapp.net/attachments/1249672084137705544/1399394518758985829/Drei.jpg?ex=6888d734&is=688785b4&hm=a113deb86a128f1f6e96abb76599382b621c789f92412f0e750b8e34989f3964&=&format=webp&width=775&height=780')
        .setTimestamp()
        .setFooter({ text: 'Bot Developer Info', iconURL: client.user.avatarURL() });
      
      await interaction.reply({ embeds: [developerEmbed] });
    } else if (commandName === 'owner') {
      const ownerData = { username: 'Prestige Beta', join_date: new Date() };

      const ownerEmbed = new EmbedBuilder()
        .setTitle('Bot Owner Profile: Prestige Beta')
        .setDescription(`Meet ${ownerData.username}, the visionary behind this server!`)
        .addFields(
          { name: 'Name', value: ownerData.username, inline: true },
          { name: 'Role', value: 'Discord Owner & Game Developer', inline: true },
          { name: 'Joined', value: new Date(ownerData.join_date).toLocaleDateString(), inline: true },
          { name: 'About', value: 'Bachelor of Science in Entertainment and Multimedia Computing. Passionate about crafting immersive game experiences and building vibrant Discord communities.' },
          { name: 'Fun Fact', value: 'Loves pixel art and retro-style game development!', inline: false },
          { 
            name: 'Social Links', 
            value: '[GitHub](https://github.com) | [Instagram](https://www.instagram.com/lenarddoesart/) | [LinkedIn](https://linkedin.com)', 
            inline: false 
          }
        )
        .setColor('#00ff00')
        .setImage('https://cdn.discordapp.com/attachments/1249672084137705544/1399389644193529916/Purple_Aquamarine_Art_Pixel_Art_Discord_Profile_Banner.gif?ex=6888d2aa&is=6887812a&hm=33cd17cb3703cafad30cf98c50791ff9c66f5fd78c7259e60c4985c3049b2ce9&')
        .setThumbnail('https://media.discordapp.net/attachments/1249672084137705544/1399391951786344558/Lenard.jpg?ex=6888d4d0&is=68878350&hm=78d4812b618034a4429bc82d88579b3e6c38a1e7a7e21162b9eaaa0e7ac11c95&=&format=webp')
        .setTimestamp()
        .setFooter({ text: 'Bot Owner Info', iconURL: client.user.avatarURL() });
      
      await interaction.reply({ embeds: [ownerEmbed] });
    } else if (commandName === 'memberlist') {
      try {
        // Fetch guild members
        const guild = interaction.guild;
        await guild.members.fetch();
        const nonBotMembers = guild.members.cache
          .filter(member => !member.user.bot)
          .sort((a, b) => (a.joinedAt || new Date()) - (b.joinedAt || new Date()));

        if (nonBotMembers.size === 0) {
          await interaction.reply({ content: 'No non-bot members found in the server.', flags: InteractionResponseType.Ephemeral });
          return;
        }

        // Create a single embed for the member list
        const embed = new EmbedBuilder()
          .setTitle('Server Member List')
          .setDescription(`List of all ${nonBotMembers.size} non-bot members in the server`)
          .setColor('#00ff00')
          .setTimestamp()
          .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: client.user.avatarURL() });

        // Build the member list, splitting into fields if necessary
        let memberList = '';
        const maxFieldLength = 1024; // Discord embed field character limit
        let fieldsAdded = 0;
        const maxFields = 25; // Discord embed field limit

        for (const member of nonBotMembers.values()) {
          const memberEntry = `- ${member.user.username} (Joined: ${new Date(member.joinedAt || new Date()).toLocaleDateString()})\n`;
          
          // Check if adding this entry exceeds the field length
          if (memberList.length + memberEntry.length > maxFieldLength || fieldsAdded >= maxFields) {
            embed.addFields({ name: `Members (Part ${fieldsAdded + 1})`, value: memberList || 'No members', inline: false });
            memberList = memberEntry;
            fieldsAdded++;
          } else {
            memberList += memberEntry;
          }
        }

        // Add the final field
        if (memberList) {
          embed.addFields({ name: `Members (Part ${fieldsAdded + 1})`, value: memberList, inline: false });
        }

        // Check if the embed exceeds the total character limit
        const totalLength = JSON.stringify(embed.toJSON()).length;
        if (totalLength > 6000) {
          await interaction.reply({ content: 'The member list is too large to display in a single embed. Please contact the developer to handle this case.', flags: InteractionResponseType.Ephemeral });
          console.error(`Embed character limit exceeded: ${totalLength} characters`);
          return;
        }

        // Send the single embed
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Error fetching member list:', error);
        await interaction.reply({ content: 'There was an error fetching the member list!', flags: InteractionResponseType.Ephemeral });
      }
    } else if (commandName === 'memberinfo') {
      try {
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
          await interaction.reply({ content: 'That user is not a member of this server!', flags: InteractionResponseType.Ephemeral });
          return;
        }

        if (member.user.bot) {
          await interaction.reply({ content: 'Information for bot accounts is not available.', flags: InteractionResponseType.Ephemeral });
          return;
        }

        const roles = member.roles.cache
          .filter(role => role.name !== '@everyone')
          .map(role => role.name)
          .join(', ') || 'None';

        const embed = new EmbedBuilder()
          .setTitle(`Member Info: ${member.user.username}`)
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            { name: 'Username', value: member.user.tag, inline: true },
            { name: 'User ID', value: member.user.id, inline: true },
            { name: 'Joined Server', value: new Date(member.joinedAt || new Date()).toLocaleDateString(), inline: true },
            { name: 'Status', value: member.presence?.status || 'Offline', inline: true },
            { name: 'Roles', value: roles, inline: false }
          )
          .setColor('#00ff00')
          .setTimestamp()
          .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: client.user.avatarURL() });

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Error fetching member info:', error);
        await interaction.reply({ content: 'There was an error fetching the member info!', flags: InteractionResponseType.Ephemeral });
      }
    }
  } catch (error) {
    console.error(`Error handling ${commandName} command:`, error);
    await interaction.reply({ content: 'There was an error while executing this command!', flags: InteractionResponseType.Ephemeral });
  }
});

// Login to Discord using environment variable
client.login(process.env.DISCORD_TOKEN);