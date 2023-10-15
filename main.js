const { GatewayIntentBits, Client, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.json');
const token = config.token;
const clientId = config.clientId;
const guildId = config.guildId;
const userTableName = config.db_table;
const verifyChannelId = config.verifyChannelId;
const mysql = require('mysql2');
const commands = [
	{
		name: 'start',
		description: 'Отправляет закрепленное сообщение',
	},
];
const con = mysql.createConnection({
	host: config.db_host,
	user: config.db_user,
	password: config.db_pass,
	database: config.db_name,
});

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildScheduledEvents
	],
});
require("./Anti-Crash-V14.js")(client);
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);
	} catch (error) {
		console.error(error);
	}
})();

client.on('ready', () => {
	console.log(`Бот запущен как ${client.user.tag}!`);
	const channel = client.channels.cache.get(verifyChannelId);

	channel.bulkDelete(1);

	if (channel) {
		channel.send({
			embeds: [
				new EmbedBuilder()
					.setTitle('Верификация')
					.setColor('#FF0000')
					.setDescription('Нажмите на кнопку ниже для верификации!')
			],
			components: [
				new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('verification')
							.setLabel('Верификация')
							.setStyle(ButtonStyle.Success)
					)
			],
		})
	}
});

client.on('interactionCreate', async (interaction) => {
	if (interaction.isButton()) {
		interaction.showModal(
			new ModalBuilder()
				.setCustomId('verifyModal')
				.setTitle('Верификация')
				.addComponents(
					new ActionRowBuilder()
						.addComponents(
							new TextInputBuilder()
								.setCustomId('code')
								.setLabel('Введите ваш 5-значный код')
								.setMinLength(5)
								.setMaxLength(5)
								.setRequired(true)
								.setStyle(TextInputStyle.Short)
						)
				)
		)

	}
	else if (interaction.isModalSubmit()) {
		try {
			con.connect((err) => {
				if (err) throw err;
				const code = interaction.fields.getTextInputValue('code');
				con.query('SELECT name FROM `' + userTableName + '` WHERE verify_code = \'' + code + '\'', (err, results, fields) => {
					if (err) throw err;
					if (results.length > 0) {
						con.query('UPDATE ' + userTableName + ' SET discord_id = ' + interaction.user.id + ', verify_code = NULL WHERE verify_code = \'' + code + '\'', (err, results) => {
							if (err) throw err
							if (results.affectedRows > 0) {
								//interaction.member.setNickname(name);
								interaction.reply({
									embeds: [
										new EmbedBuilder()
											.setTitle('Успешно')
											.setDescription('Вы были успешно верифицированы!\n*Напишите в игровой чат /verify для принятия изменений*')
											.setColor('#008000')
									],
									ephemeral: true,
								})
							}
							else throw err;
							con.end((err) => {
								if (err) throw err;
							});
						});
					}
					else {
						interaction.reply({
							embeds: [
								new EmbedBuilder()
									.setColor('#FF0000')
									.setTitle('Ошибка')
									.setDescription('Вы ввели неверный код или его срок действия истек')
							],
							ephemeral: true
						});
					}
				});
			})
		}
		catch (err) {
			console.error('-1: Ошибка при выполнении запроса к базе данных:\n', err);
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor('#FF0000')
						.setTitle('Произошла ошибка. Обратитесь в тех. поддержку')
						.setDescription('Код ошибки: -1')
				],
				ephemeral: true,
			});
		};
	}
});

client.login(token);
