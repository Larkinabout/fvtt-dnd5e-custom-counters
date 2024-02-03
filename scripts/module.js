import { CharacterCountersForm, NpcCountersForm } from './form.js'

export const MODULE = {
    ID: 'dnd5e-custom-counters'
}

export const SYSTEM_PROPERTY = {
    'death-saves': '@attributes.death.success',
    exhaustion: '@attributes.exhaustion',
    inspiration: '@attributes.inspiration',
    legact: '@resources.legact.value',
    legres: '@resources.legres.value',
    lair: '@resources.lair.value'
}

Hooks.on('renderActorSheet', (app, html, data) => {
    const actorSheetTypes = {
        ActorSheet5eCharacter: {
            type: 'character',
            countersSetting: 'characterCounters',
            legacy: true
        },
        ActorSheet5eCharacter2: {
            type: 'character',
            countersSetting: 'characterCounters',
            legacy: false
        },
        ActorSheet5eNPC: {
            type: 'npc',
            countersSetting: 'npcCounters',
            legacy: true
        }
    }

    const actorSheetType = actorSheetTypes[app.constructor.name]

    if (!actorSheetType) return

    if (actorSheetType.legacy) {
        addCountersLegacy(app, html, data, actorSheetType)
    } else {
        addCounters(app, html, data, actorSheetType)
    }
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
        restricted: true,
        scope: 'world'
    })

    game.settings.registerMenu(MODULE.ID, 'npcCountersMenu', {
        hint: game.i18n.localize('dnd5eCustomCounters.npcCountersMenu.hint'),
        label: game.i18n.localize('dnd5eCustomCounters.npcCountersMenu.label'),
        name: game.i18n.localize('dnd5eCustomCounters.npcCountersMenu.name'),
        icon: 'fas fa-pen-to-square',
        type: NpcCountersForm,
        restricted: true,
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

function addCounters (app, html, data, actorSheetType) {
    const actor = app.actor
    const counters = game.settings.get(MODULE.ID, actorSheetType.countersSetting)
    const detailsRightDiv = html[0].querySelector('.tab.details > .right')
    const detailsRightTopDiv = detailsRightDiv.querySelector('.top')
    const countersDiv = createCountersDiv()
    const ul = document.createElement('ul')
    countersDiv.appendChild(ul)
    detailsRightTopDiv.after(countersDiv)

    for (const [key, counter] of Object.entries(counters)) {
        if (counter.system) {
            continue
        }

        if (!counter.visible) {
            continue
        }

        let li = null

        switch (counter.type) {
        case 'checkbox':
            li = createCheckbox(actor, key, counter)
            break
        case 'number':
            li = createNumber(actor, key, counter)
            break
        case 'successFailure':
            li = createSuccessFailure(actor, key, counter)
            break
        }

        ul.appendChild(li)
    }
}

function createCountersDiv () {
    const div = document.createElement('div')
    div.classList.add('dnd5e-custom-counters-counters')

    const h3 = document.createElement('h3')
    h3.setAttribute('class', 'icon')
    div.appendChild(h3)

    const i = document.createElement('i')
    i.classList.add('fas', 'fa-scroll')
    h3.appendChild(i)

    const span = document.createElement('span')
    span.setAttribute('class', 'roboto-upper')
    span.textContent = game.i18n.localize('dnd5eCustomCounters.counters')
    h3.appendChild(span)

    return div
}

function createCheckbox (actor, key, counter) {
    const li = document.createElement('li')
    li.classList.add('dnd5e-custom-counters-counter', 'flexrow', key)

    const label = document.createElement('label')
    label.setAttribute('class', 'flexrow')
    li.appendChild(label)

    const h4 = document.createElement('h4')
    h4.textContent = counter.name
    label.appendChild(h4)

    const input = document.createElement('input')
    input.setAttribute('type', 'checkbox')
    input.setAttribute('name', `flags.${MODULE.ID}.${key}`)
    input.checked = actor.getFlag(MODULE.ID, key) || false
    input.setAttribute('value', actor.getFlag(MODULE.ID, key) || false)
    input.setAttribute('placeholder', 'false')
    input.setAttribute('data-dtype', 'Boolean')
    label.appendChild(input)

    return li
}

function createNumber (actor, key, counter) {
    const li = document.createElement('li')
    li.classList.add('dnd5e-custom-counters-counter', 'flexrow', key)
    const h4 = document.createElement('h4')
    h4.textContent = counter.name
    li.appendChild(h4)
    const div = document.createElement('div')
    div.setAttribute('class', 'dnd5e-custom-counters-counter-value')
    li.appendChild(div)
    const input = document.createElement('input')
    input.setAttribute('type', 'text')
    input.setAttribute('name', `flags.${MODULE.ID}.${key}`)
    input.setAttribute('value', actor.getFlag(MODULE.ID, key) || 0)
    input.setAttribute('placeholder', '0')
    input.setAttribute('data-dtype', 'Number')
    div.appendChild(input)

    return li
}

function createSuccessFailure (actor, key, counter) {
    const li = document.createElement('li')
    li.classList.add('dnd5e-custom-counters-counter', 'flexrow', key)

    const h4 = document.createElement('h4')
    h4.textContent = counter.name
    li.appendChild(h4)

    const div = document.createElement('div')
    div.classList.add('dnd5e-custom-counters-counter-value', 'flexrow', key)
    li.appendChild(div)

    const iSuccess = document.createElement('i')
    iSuccess.classList.add('fas', 'fa-check')
    div.appendChild(iSuccess)

    const inputSuccess = document.createElement('input')
    inputSuccess.setAttribute('type', 'text')
    inputSuccess.setAttribute('name', `flags.${MODULE.ID}.${key}.success`)
    inputSuccess.setAttribute('value', actor.getFlag(MODULE.ID, `${key}.success`) || 0)
    inputSuccess.setAttribute('placeholder', '0')
    inputSuccess.setAttribute('data-dtype', 'Number')
    div.appendChild(inputSuccess)

    const iFailure = document.createElement('i')
    iFailure.classList.add('fas', 'fa-times')
    div.appendChild(iFailure)

    const inputFailure = document.createElement('input')
    inputFailure.setAttribute('type', 'text')
    inputFailure.setAttribute('name', `flags.${MODULE.ID}.${key}.failure`)
    inputFailure.setAttribute('value', actor.getFlag(MODULE.ID, `${key}.failure`) || 0)
    inputFailure.setAttribute('placeholder', '0')
    inputFailure.setAttribute('data-dtype', 'Number')
    div.appendChild(inputFailure)

    return li
}

function addCountersLegacy (app, html, data, actorSheetType) {
    const counters = game.settings.get(MODULE.ID, actorSheetType.countersSetting)
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
