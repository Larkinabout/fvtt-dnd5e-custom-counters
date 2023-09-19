import { MODULE } from './module.js'

export class CountersForm extends FormApplication {
    constructor (...args) {
        super(args)
    }

    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            id: `${MODULE.ID}-form`,
            template: `modules/${MODULE.ID}/templates/form.hbs`,
            dragDrop: [{dragSelector: ".counter-item", dropSelector: ".counter-list"}],
            width: 600,
            height: 'auto',
            closeOnSubmit: true
        })
    }

    activateListeners (html) {
        super.activateListeners(html)

        html.on('click', '[data-action]', this._handleButtonClick.bind(this))

        const cancel = html.find(`#${MODULE.ID}-cancel`)
        cancel.on('click', this.close.bind(this))

        this.items = Array.from(html[0].querySelectorAll('.counter-item'))
    }

    /** @override */
    _canDragStart(selector) {
        return true;
    }
  
    /** @inheritdoc */
    _canDragDrop(selector) {
        return true;
    }

    /** @override */
    _onDragStart(event) {
        this.items = Array.from(event.target.closest('.counter-list').querySelectorAll('.counter-item'))
        this.sourceItem = event.target
        this.sourceIndex = this.items.findIndex(item => item.dataset.key === this.sourceItem.dataset.key)
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/html', this.sourceItem.innerHTML)
        this.sourceItem.style.opacity = '0.5'
    }

    /** @override */
    _onDrop(event) {
        this.sourceItem.style.removeProperty('opacity')

        this.targetItem = event.target.closest('li')
        this.targetIndex = this.items.findIndex(item => item.dataset.key === this.targetItem.dataset.key)
        
        if (this.targetIndex < this.sourceIndex) {
            this.targetItem.before(this.sourceItem)
        } else {
            this.targetItem.after(this.sourceItem)
        }
    } 

    async _handleButtonClick (event) {
        event.preventDefault()
        const clickedElement = $(event.currentTarget)
        const action = clickedElement.data().action
        const key = clickedElement.parents('li')?.data()?.key
        switch (action) {
          case 'delete': {
            await this.#deleteCounter(key)
            break
          }
          case 'new': {
            await this.#createCounter()
            break
          }
        }
    }

    async #createCounter () { 
        const counterList = this.element[0].querySelector('.counter-list')

        const key = randomID()

        const counterItem = document.createElement('li')
        counterItem.classList.add('flexrow', 'counter-item')
        counterItem.setAttribute('draggable', 'true')
        counterItem.setAttribute('data-key', key)

        counterItem.innerHTML =
        `<i class="flex0 fas fa-grip-lines"></i>
        <div class="fields">
            <input id="key" name="key" type="hidden" value="${key}">
            <div class="field">
                <label>Name</label>
                <input id="name" name="name" type="text" value="">
            </div>
            <div class="field">
                <label>Type</label>
                <select id="type" name="type">
                    <option value="checkbox">${game.i18n.localize("dnd5eCustomCounters.checkbox")}</option>
                    <option value="number">${game.i18n.localize("dnd5eCustomCounters.number")}</option>
                    <option value="successFailure">${game.i18n.localize("dnd5eCustomCounters.successFailure")}</option>
                </select>
            </div>
            <div class="field">
                <label>Visible</label>
                <input id="visible" name="visible" type="checkbox">
            </div>
        </div>
        <button type="button" data-tooltip="Delete" data-action="delete" class="flex0 delete-button">
            <i class="fas fa-xmark"></i>
        </button>
        <input id="delete" name="delete" type="hidden" value="false">`

        counterItem.addEventListener('dragstart', this.items[0].ondragstart)

        counterList.appendChild(counterItem)

        this.element[0].style.height = 'auto'
    }

    async #deleteCounter (key) {
        const del = async (key) => {
            const element = this.element[0].querySelector(`[data-key="${key}"]`)
            const deleteInput = element.querySelector('input[name="delete"]')
            deleteInput.setAttribute('value', 'true')
            element.classList.add('hidden')
            this.element[0].style.height = 'auto'
        }

        const d = new Dialog({
            title: game.i18n.localize('dnd5eCustomCounters.delete.dialog.title'),
            content: `<p>${game.i18n.localize('dnd5eCustomCounters.delete.dialog.content')}</p>`,
            buttons: {
                yes: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('dnd5eCustomCounters.delete.dialog.yes'),
                    callback: async () => {
                        del(key)
                    }
                },
                no: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('dnd5eCustomCounters.delete.dialog.no')
                }
            }
        })
        d.render(true)  
    }

    async _updateObject (event, formData) {
        const counters = {}

        for (let index = 0; index <  Object.keys(formData.name).length; index++) {
            const key = formData.key[index]

            if (formData.delete[index] === 'true') {
                for (const actor of game.actors) {
                    actor.unsetFlag(MODULE.ID, key)
                } 
                continue
            }
            
            const name = formData.name[index]
            const type = formData.type[index]
            const system = ['death-saves', 'exhaustion', 'inspiration'].includes(key)
            const visible = formData.visible[index]

            counters[key] = { name, type, system, visible }
        }

        await game.settings.set(MODULE.ID, this.countersSetting, counters) 
    }
}


export class CharacterCountersForm extends CountersForm {
    constructor () {
        super()
        this.countersSetting = 'characterCounters'
    }

    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize('dnd5eCustomCounters.characterCountersForm.title')
        })
    }

    async getData () {
        const counters = game.settings.get(MODULE.ID, 'characterCounters')
        return { counters }
    }
}