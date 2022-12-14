const pronote = require('pronote-api-maintained');
const Discord = require("discord.js")
const figlet = require("figlet")
const Color = require("sync-color")
const {
    url,
    FirstGroup,
    secondGroup,
    DiscordPrefix: prefix,
    DiscordToken: token,
    WhiteListGuild
} = require("./config.json")

var gr1 = "", gr2 = ""
var client = new Discord.Client();

client.login(token)

async function restartPronote() {
    if (FirstGroup.username && FirstGroup.password) {
        gr1 = await pronote.login(url, FirstGroup.username, FirstGroup.password);
        gr1.setKeepAlive(true)
    }
    if (secondGroup.username && secondGroup.password) {
        gr2 = await pronote.login(url, secondGroup.username, secondGroup.password);
        gr2.setKeepAlive(true)
    }
}
client.on("ready", async () => {
    
    await restartPronote()
    if (!gr1 && !gr2) return console.log(Color.retro("Vous Ne Pouvez Pas Utilisez Cette Application Sans Compte !"))

    var ascii = figlet.textSync("PRONOTE", {
        font: "Train",
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
    })
    console.log(Color.InitGradient("blue", "magenta")(`${ascii}
                - ${dateCalcul(new Date())}
                - ${gr1 ? gr1.user.name : "Pas De Groupe 1"}
                - ${gr2 ? gr2.user.name : "Pas De Groupe 2"}
                - ${gr1 ? gr1.user.studentClass.name : gr2 ? gr2.user.studentClass.name : "Pas De Classe"}
                - By !"Dialz_†#0069`))

})
client.on("message", async message => {
    if (!WhiteListGuild.includes(message.guild.id)) return
    if (message.channel.type == "dm") return
    if (!message.content.startsWith(prefix)) return
    var argArray = message.content.split(" ")
    var command = argArray[0].slice(prefix.length).toLowerCase()
    switch (command) {
        case "help":
            message.channel.send(makeEmbed(`${prefix}edt -> Affiche l'Emploie Du Temps, \n${prefix}vac -> Affiche l'emploie du temps des Vacances, \n${prefix}notes -> Affiche Les Moyennes De Vos Notes, \n${prefix}devoirs -> Affiche Les Devoirs Pour Demain, \n${prefix}infos -> Vous Donnes Les Informations envoyé par l'Administation`, null, gr1 ? 1 : 2))
            break
        case "edt":
            var {
                timetable,
                gr2_time
            } = await getInfos()

            var toSend = []
            var toSend2Gr = []

            timetable?.forEach(r => {
                r.subject = r.subject.replace(r.subject[0], r.subject[0].toUpperCase())
                var nnn = r.status !== undefined ? r.subject + " - " + r.status : r.subject
                toSend.push({
                    name: nnn,
                    value: `${r.room ? r.room : r.subject} - ${getHours(r.from)}h à ${getHours(r.to)}h - ${getHours(r.to) - getHours(r.from)}h`,
                })
            })
            gr2_time?.forEach(r => {
                r.subject = r.subject.replace(r.subject[0], r.subject[0].toUpperCase())
                var nnn = r.status !== undefined ? r.subject + " - " + r.status : r.subject
                toSend2Gr.push({
                    name: nnn,
                    value: `${r.room ? r.room : r.subject} - ${getHours(r.from)}h à ${getHours(r.to)}h - ${getHours(r.to) - getHours(r.from)}h`,
                })
            })
            if (gr1) message.channel.send(makeEmbed("Emploie Du Temps Du Jour 1e GRP", toSend, 1))
            if (gr2) message.channel.send(makeEmbed("Emploie Du Temps Du Jour 2e GRP", toSend2Gr, 2))
            break
        case "infos":
            var {
                infos
            } = await getInfos()
            var toSend = []
            infos.forEach(r => toSend.push({
                name: r.title,
                value: r.author
            }))
            message.channel.send(makeEmbed("Informations", toSend, gr1 ? 1 : 2))
            break
        case "vac":
            var holidays = gr1 ? gr1.params.publicHolidays : gr2.params.publicHolidays
            var toSend = []
            holidays.forEach(r => {
                toSend.push({
                    name: r.name,
                    value: `${dateCalcul(r.from)} To ${dateCalcul(r.to)}`
                })
            })
            message.channel.send(makeEmbed("Vacances De L'année", toSend, gr1 ? 1 : 2))
            break
        case "notes":
            var {
                marks,
                GR2Marks
            } = await getInfos()
            var _ = []
            var _2 = []

            marks?.subjects.forEach(r => {
                _.push({
                    name: r.name,
                    value: `Moyenne: ${![-1, 0].includes(r.averages.student) ? r.averages.student : ":x:"} | Classe: ${![-1, 0].includes(r.averages.studentClass) ? r.averages.studentClass : ":x:"}`
                })
            })
            GR2Marks?.subjects.forEach(r => {
                _2.push({
                    name: r.name,
                    value: `Moyenne: ${![-1, 0].includes(r.averages.student) ? r.averages.student : ":x:"} | Classe: ${![-1, 0].includes(r.averages.studentClass) ? r.averages.studentClass : ":x:"}`
                })
            })
            if (gr1) message.channel.send(makeEmbed(`**MG: **${marks.averages.student ?? ":x:"} - **MGClasse:** ${marks.averages.studentClass ?? ":x:"}`, _, 1))
            if (gr2) message.channel.send(makeEmbed(`**MG: **${GR2Marks.averages.student ?? ":x:"} - **MGClasse:** ${GR2Marks.averages.studentClass ?? ":x:"}`, _2, 2))
            break

        case "devoirs":
            var {
                homeworks,
                HomeWorksGR2
            } = await getInfos()
            var _ = []
            var _2 = []
            homeworks?.forEach(r => {
                _.push({
                    name: r.subject,
                    value: r.description
                })
            })
            HomeWorksGR2?.forEach(r => {
                _2.push({
                    name: r.subject,
                    value: r.description
                })
            })
            if (gr1) message.channel.send(makeEmbed("Devoirs Pour Demain GR1", _))
            if (gr2) message.channel.send(makeEmbed("Devoirs Pour Demain GR2", _, 2))
            break

    }
})

function dateCalcul(r) {
    var date = new Date(r)
    var day = date.getDate()
    var month = date.getMonth()
    var year = date.getFullYear()
    return `${day}/${month + 1}/${year}`
}

function getHours(r) {
    return new Date(r).getHours()
}

function makeEmbed(a, b, c) {
    var embed = new Discord.MessageEmbed()
        .setAuthor()
        .setTitle(a)
        .setURL(url)
        .setFooter(`!"Dialz_†#0069`, "https://cdn.discordapp.com/avatars/724994837903966238/a_b85bb8fd6597a2ff7379e8ccf0b1321a.gif")
        .setTimestamp()
        .setColor("#00aaaa")
    if (b) embed.fields = b
    if (c == 2) {
        embed.author.name = gr2.user.name + " - " + gr2.user.studentClass.name
        embed.author.iconURL = gr2.user.avatar
    } else {
        embed.author.name = gr1.user.name + " - " + gr1.user.studentClass.name
        embed.author.iconURL = gr1.user.avatar
    }
    return embed
}

async function getInfos() {
    gr1 ? (
        gr1Time = await gr1.timetable(),
        marks = await gr1.marks(),
        homeworks = await gr1.homeworks()
    ): ""
    gr2 ? (
        gr2Time = await gr2.timetable(),
        GR2Marks = await gr2.marks(),
        HomeWorksGR2 = await gr2.homeworks()
    ): ""
    var infos = gr2 ? await gr2.infos() : await gr1.infos()
    return {
        timetable: gr1Time || null,
        gr2_time: gr2Time || null,
        marks: marks || null,
        GR2Marks: GR2Marks || null,
        homeworks: homeworks || null,
        HomeWorksGR2: HomeWorksGR2 || null,
        infos: infos,
    }
}

process.on("unhandledRejection", async callback => {
    console.log(callback)
    if (callback.message.includes("404")) return console.log("URL Pronote Invalide.")
    switch (callback.code) {
        case 3:
            console.log("Username/Mot De Passe Incorrect")
            return
        case 6:
            console.log("Rate Limited Car Trop De Requêtes A l'API De Pronote Qui Ont été Mauvaises (Failed)")
            return
        case 5:
            console.log("Erreur Ou Inactivité, Le Bot Redémarre")
            client.destroy()
            await restartPronote()
            return
    }
})
process.on("uncaughtException", callback => { console.log(callback) })
