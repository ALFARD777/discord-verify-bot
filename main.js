const { GatewayIntentBits, Client, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle	} = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.json');

const token = config.token;
const clientId = config.clientId;
const guildId = config.guildId;
const commands = [
	{
		name: 'start',
		description: 'Отправляет закрепленное сообщение',
	},
];

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

client.on('ready', () => {
	console.log(`Бот запущен как ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
	if (!(interaction.isCommand() || interaction.isModalSubmit())) return;
	if (interaction.isCommand()) {
		const { commandName } = interaction;
		if (commandName === 'start' && interaction.channel.id == 1031361900186968086) {
			const button = new ActionRowBuilder()
				.addComponents(new ButtonBuilder()
				.setCustomId('verification')
				.setLabel('Верификация')
				.setStyle(ButtonStyle.Success)
			);
			const embed = new EmbedBuilder()
					.setTitle('Верификация')
					.setColor('#FF0000')
					.setDescription('Нажмите на кнопку ниже для верификации!');
			const mes = await interaction.channel.send({
					embeds: [embed],
					components: [button],
			})
			const collector = mes.createMessageComponentCollector();
			collector.on('collect', async i => {
				await i.deferUpdate();
				const modal = new ModalBuilder()
					.setCustomId('verifyModal')
					.setTitle('Верификация');
				const codeInput = new TextInputBuilder()
					.setCustomId('code')
					.setLabel("Введите ваш код")
					.setMinLength(5)
					.setMaxLength(5)
					.setRequired(true)
					.setStyle(TextInputStyle.Short);
				modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
				await interaction.showModal(modal);
			});
		}
	}
	if (interaction.isModalSubmit()) {
		await interaction.deferUpdate();
		const code = interaction.fields.getTextInputValue('code');
		await interaction.channel.send("Code: " + code);
	}
});

client.login(token);
