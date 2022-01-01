import Dialog from "./classes/Dialog.js";
import Observer from "./classes/Observer.js";
import Tokens from "./classes/Tokens.js";
import {
    getCached
} from "./utils/fetch.js";
import {
    lookup,
    lookupOne,
    lookupCached,
    lookupOneCached,
    identify
} from "./utils/elements.js";

lookupCached("[data-dialog]").forEach((trigger) => {
    trigger.dialog = Dialog.createFromTrigger(trigger);
});

class CharacterData {

    constructor(url) {
        this.lookup = getCached(url);
    }

    then(handler) {
        return this.lookup.then(handler);
    }

    getEdition(edition) {

        return this.then((characters) => (
            characters.filter((character) => character.edition === edition)
        ));

    }

    getIds(ids) {

        const idList = ids.map(({ id }) => id);

        return this.then((characters) => (
            characters.filter((character) => idList.includes(character.id))
        ));

    }

    get(id) {

        return this.then((characters) => (
            characters.find((character) => character.id === id)
        ));

    }

}

const gameObserver = Observer.create("game");

const characterData = new CharacterData("/assets/data/characters.json");
characterData.then((characters) => gameObserver.trigger("characters-loaded", characters));

gameObserver.on("characters-loaded", () => {
    lookupOne("#select-characters").disabled = false;
});

const editionList = lookupOne("#edition-list");
const editionListDialog = Dialog.create(editionList);
const characterSelectTemplate = lookupOne("#character-select-template");

editionList.addEventListener("click", ({ target }) => {

    const button = target.closest("[data-edition]");

    if (!button) {
        return;
    }

    const {
        edition
    } = button.dataset;

    characterData.getEdition(edition).then((characters) => {
        gameObserver.trigger("characters-selected", characters);
    });

});

gameObserver.on("characters-selected", ({ detail: characters }) => {

    lookupCached("[data-team]").forEach((wrapper) => {

        const wrapperTeam = wrapper.dataset.team;
        const list = lookupOneCached(".js--character-select--list", wrapper);

        list.innerHTML = "";
        const frag = document.createDocumentFragment();

        characters.forEach(({
            id,
            team,
            image,
            name
        }) => {

            if (team !== wrapperTeam) {
                return;
            }

            const clone = characterSelectTemplate.content.cloneNode(true);
            const label = clone.querySelector(".js--character-select--label");
            const input = clone.querySelector(".js--character-select--input");
            const img = clone.querySelector(".js--character-select--image");
            const text = clone.querySelector(".js--character-select--name");

            label.htmlFor = identify(input);
            input.value = id;
            img.src = image;
            text.textContent = name;

            frag.append(clone);

        });

        list.append(frag);

    });

    editionListDialog.hide();

});

lookupCached("[data-team]").forEach((wrapper) => {

    const countElement = lookupOneCached(".js--character-select--count", wrapper);

    wrapper.addEventListener("change", ({ target }) => {

        gameObserver.trigger("character-toggle", {
            id: target.value,
            active: target.checked
        });

        countElement.textContent = lookup(
            "input[type=\"checkbox\"]:checked",
            wrapper
        ).length;

    });

});

const playerCount = lookupOne("#player-count");
const playerCountOutput = lookupOne("#player-count-output");

playerCount.addEventListener("input", () => playerCountOutput.value = playerCount.value);

class GameData {

    constructor(url) {
        this.lookup = getCached(url);
    }

    then(handler) {
        return this.lookup.then(handler);
    }

    getRow(players) {

        return this.then((data) => {
            return data[Math.min(players - 5, data.length - 1)];
        });

    }

}


const gameData = new GameData("/assets/data/game.json");

function setTotals() {

    gameData.getRow(playerCount.value).then((data) => {

        Object.entries(data).forEach(([team, count]) => {

            lookupCached(`[data-team="${team}"] .js--character-select--total`).forEach((element) => {
                element.textContent = count;
            });

        });

    })

}

playerCount.addEventListener("input", setTotals);
gameData.then(setTotals);


gameObserver.on("characters-selected", ({ detail: characters }) => {

    const template = lookupOneCached("#character-list-template");
    const frag = characters.reduce((frag, character) => {

        const clone = template.content.cloneNode(true);
        const button = clone.querySelector(".js--character-list--button");
        const ability = clone.querySelector(".js--character-list--ability");
        const token = clone.querySelector(".js--character-list--token");

        button.dataset.id = character.id;
        button.dataset.character = JSON.stringify(character);
        token.append(drawCharacter(character));
        ability.textContent = character.ability;

        frag.append(clone);

        return frag;

    }, document.createDocumentFragment());

    const list = lookupOneCached("#character-list__list");
    list.innerHTML = "";
    list.append(frag);

});

function drawCharacter({
    id,
    name,
    image,
    reminders = [],
    remindersGlobal = [],
    firstNight,
    otherNight,
    setup
}) {

    const clone = lookupOneCached("#character-template").content.cloneNode(true);
    const leaves = clone.querySelector(".js--character--leaves");

    leaves.classList.toggle("character--setup", setup);
    leaves.classList.toggle("character--left-1", firstNight);
    leaves.classList.toggle("character--right-1", otherNight);
    const totalTop = reminders.length + remindersGlobal.length;
    leaves.classList.toggle(`character--top-${totalTop}`, totalTop);

    clone.querySelector(".js--character--image").src = image;
    clone.querySelector(".js--character--name").textContent = name;

    return clone;

}

lookupOneCached("#character-list__list").addEventListener("click", ({ target }) => {

    const button = target.closest("[data-id]");

    if (!button) {
        return;
    }

    const character = JSON.parse(button.dataset.character);
    const tokenTemplate = lookupOneCached("#token-template").content.cloneNode(true);
    const wrapper = tokenTemplate.querySelector(".js--token--wrapper");
    wrapper.dataset.id = character.id;
    wrapper.dataset.token = "character";
    wrapper.append(drawCharacter(character));

    lookupOneCached(".pad").append(wrapper);
    gameObserver.trigger("character-added", character);

    Dialog.create(button.closest(".dialog")).hide();

});

const pad = lookupOneCached(".pad");
pad.tokens = new Tokens(pad);

// If the elements are within a closed <details> element then their height and
// width will be 0. Listen for the pad becoming visible and update the class.
lookup("details").forEach((details) => {

    details.addEventListener("toggle", ({ target }) => {
        pad.tokens.updatePadDimensions();
    });

});

function drawReminder({
    id,
    image,
    text
}) {

    const clone = lookupOneCached("#reminder-template").content.cloneNode(true);
    clone.querySelector(".js--reminder--image").src = image;
    clone.querySelector(".js--reminder--text").textContent = text;

    return clone;

}

function drawReminderEntry(reminder) {

    const clone = lookupOneCached("#reminder-list-template").content.cloneNode(true);
    const button = clone.querySelector(".js--reminder-list--button");
    button.dataset.id = reminder.id;
    button.dataset.reminder = JSON.stringify(reminder);
    button.append(drawReminder(reminder));

    return clone;

}

gameObserver.on("characters-selected", ({ detail: characters }) => {

    const frag = document.createDocumentFragment();

    characters.forEach(({
        id,
        image,
        reminders = [],
        remindersGlobal = []
    }) => {

        const allReminders = [].concat(reminders, remindersGlobal);

        allReminders.forEach((reminder) => {

            frag.append(drawReminderEntry({
                image,
                id,
                text: reminder
            }));

        });

    });

    const reminders = lookupOneCached("#reminder-list__list");
    reminders.innerHTML = "";
    reminders.append(frag);

});

lookupOneCached("#reminder-list__list").addEventListener("click", ({ target }) => {

    const button = target.closest("[data-id]");

    if (!button) {
        return;
    }

    const reminder = JSON.parse(button.dataset.reminder);
    const tokenTemplate = lookupOneCached("#token-template").content.cloneNode(true);
    const wrapper = tokenTemplate.querySelector(".js--token--wrapper");
    wrapper.dataset.id = reminder.id;
    wrapper.dataset.token = "reminder";
    wrapper.append(drawReminder(reminder));

    lookupOneCached(".pad").append(wrapper);
    gameObserver.trigger("reminder-added", reminder);

    Dialog.create(button.closest(".dialog")).hide();

});

lookupOne("#reset-height").addEventListener("click", () => {
    lookupOneCached(".pad").style.height = "";
});

lookupOne("#clear-grimoire").addEventListener("click", () => {

    if (window.confirm("Are you sure you want to clear all the tokens?")) {

        const pad = lookupOneCached(".pad");

        pad.innerHTML = "";
        pad.tokens.reset();

    }

});