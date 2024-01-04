import { CharacterCountersForm, NpcCountersForm } from './form.js'

export const MODULE = {
    ID: 'dnd5e-custom-counters'
}

Hooks.on('renderActorSheet', (app, html, data) => {
    addCounters(app, html, data)
})

Hooks.on('ready', async () => {
    registerSettings()
})

function registerSettings () {
    game.settings.registerMenu(MODULE.ID, 'characterCountersMenu', {
        hint: game.i18n.localize('dnd5eCustomCounters.characterCountersMenu.hint'),
        label: game.i18n.localize('dnd5eCustomCounters.characterCountersMenu.label'),
        name: game.i18n.localize('dnd5eCustomCounters.characterCountersMenu.name'),
        icon: 'fas fa-pen-to-square',
        type: CharacterCountersForm,
        restricted: false,
        scope: 'world'
    })

    game.settings.registerMenu(MODULE.ID, 'npcCountersMenu', {
        hint: game.i18n.localize('dnd5eCustomCounters.npcCountersMenu.hint'),
        label: game.i18n.localize('dnd5eCustomCounters.npcCountersMenu.label'),
        name: game.i18n.localize('dnd5eCustomCounters.npcCountersMenu.name'),
        icon: 'fas fa-pen-to-square',
        type: NpcCountersForm,
        restricted: false,
        scope: 'world'
    })

    game.settings.register(MODULE.ID, 'characterCounters', {
        name: 'Character Counters',
        scope: 'world',
        config: false,
        type: Object,
        default: {
            'death-saves': { name: game.i18n.localize('DND5E.DeathSave'), type: 'successFailure', system: true, visible: true },
            exhaustion: { name: game.i18n.localize('DND5E.Exhaustion'), type: 'number', system: true, visible: true },
            inspiration: { name: game.i18n.localize('DND5E.Inspiration'), type: 'checkbox', system: true, visible: true }
        }
    })

    game.settings.register(MODULE.ID, 'npcCounters', {
        name: 'NPC Counters',
        scope: 'world',
        config: false,
        type: Object,
        default: {
            legact: { name: game.i18n.localize('DND5E.LegAct'), type: 'successFailure', system: true, visible: true },
            legres: { name: game.i18n.localize('DND5E.LegRes'), type: 'successFailure', system: true, visible: true },
            lair: { name: game.i18n.localize('DND5E.LairAct'), type: 'checkbox', system: true, visible: true }
        }
    })
}

function addCounters (app, html, data) {
    const actorSheetTypes = {
        ActorSheet5eCharacter: {
            type: 'character',
            countersSetting: 'characterCounters'
        },
        ActorSheet5eNPC: {
            type: 'npc',
            countersSetting: 'npcCounters'
        }
    }

    if (!actorSheetTypes[app.constructor.name]) {
        return
    }

    const counters = game.settings.get(MODULE.ID, actorSheetTypes[app.constructor.name].countersSetting)
    const countersDiv = html.find('.counters')
    let lastItem = null

    for (const [key, counter] of Object.entries(counters)) {
        if (counter.system) {
            let currentItem = null
            switch (key) {
            case 'legact':
                currentItem = countersDiv.find('input[name="system.resources.legact.value"]').parent().parent()[0]
                break
            case 'legres':
                currentItem = countersDiv.find('input[name="system.resources.legres.value"]').parent().parent()[0]
                break
            default:
                currentItem = countersDiv.find(`.${key}`)[0]
            }

            if (counter.visible) {
                if (lastItem) {
                    lastItem.after(currentItem)
                }
                lastItem = currentItem
            } else {
                currentItem.remove()
            }

            continue
        }

        if (!counter.visible) {
            continue
        }

        const counterDiv = document.createElement('div')
        counterDiv.classList.add('counter', 'flexrow', key)

        const h4 = document.createElement('h4')
        const h4Text = document.createTextNode(counter.name)
        h4.append(h4Text)

        const counterValueDiv = document.createElement('div')
        counterValueDiv.classList.add('counter-value')

        const counterInput1 = document.createElement('input')
        const counterInput2 = document.createElement('input')

        switch (counter.type) {
        case 'checkbox':
            counterInput1.setAttribute('type', 'checkbox')
            counterInput1.setAttribute('name', `flags.${MODULE.ID}.${key}`)
            counterInput1.checked = app.actor.getFlag(MODULE.ID, key) || false
            counterInput1.setAttribute('value', app.actor.getFlag(MODULE.ID, key) || false)
            counterInput1.setAttribute('placeholder', 'false')
            counterInput1.setAttribute('data-dtype', 'Boolean')
            break
        case 'number':
            counterInput1.setAttribute('type', 'text')
            counterInput1.setAttribute('name', `flags.${MODULE.ID}.${key}`)
            counterInput1.setAttribute('value', app.actor.getFlag(MODULE.ID, key) || 0)
            counterInput1.setAttribute('placeholder', '0')
            counterInput1.setAttribute('data-dtype', 'Number')
            break
        case 'successFailure':
            counterInput1.setAttribute('type', 'text')
            counterInput1.setAttribute('name', `flags.${MODULE.ID}.${key}.success`)
            counterInput1.setAttribute('value', app.actor.getFlag(MODULE.ID, `${key}.success`) || 0)
            counterInput1.setAttribute('placeholder', '0')
            counterInput1.setAttribute('data-dtype', 'Number')
            counterInput2.setAttribute('type', 'text')
            counterInput2.setAttribute('name', `flags.${MODULE.ID}.${key}.failure`)
            counterInput2.setAttribute('value', app.actor.getFlag(MODULE.ID, `${key}.failure`) || 0)
            counterInput2.setAttribute('placeholder', '0')
            counterInput2.setAttribute('data-dtype', 'Number')
            break
        }

        countersDiv[0].appendChild(counterDiv)
        counterDiv.appendChild(h4)
        counterDiv.appendChild(counterValueDiv)

        if (counter.type === 'successFailure') {
            const iSuccess = document.createElement('i')
            const iFailure = document.createElement('i')

            iSuccess.classList.add('fas', 'fa-check')
            iFailure.classList.add('fas', 'fa-times')

            counterValueDiv.appendChild(iSuccess)
            counterValueDiv.appendChild(counterInput1)
            counterValueDiv.appendChild(iFailure)
            counterValueDiv.appendChild(counterInput2)
        } else {
            counterValueDiv.appendChild(counterInput1)
        }

        lastItem = counterDiv
    }
}
