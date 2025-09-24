{
let drawingHeader = "~h~~r~Empleados de la semana~h~~n~~u~hasta el sábado 23:59";
let drawingColor = [0, 0, 0, 255];
let drawingSize = [0.3, 0.3];
let drawingHeaderSize = [0.3, 0.3];
let drawingPos = [0.03, 0.2];
let nameSpace = 0.07;
let names = ["~h~Nombre", "Ryan Spell", "Poquetes Fukariotes", "Ryan Spell", "Poquetes Fukariotes",
    "Ryan Spell", "Poquetes Fukariotes", "Ryan Spell", "Poquetes Fukariotes",
    "Ryan Spell", "Poquetes Fukariotes"];
//let points = ["~h~Puntos", "94", "75", "70", "55", "40", "33", "20", "12", "9", "5"];
let prizes = ["~h~Premio", "$25,000", "$20,000", "$17,000", "$15,000", "$10,000", "$7,000", "$5,000", "$3,000",
    "$2,000", "$1,000"];
let boardsToShow = [];
let boardsQueue = [];
mp.rpc("board:update", (id, _boardConfig, lang) => {
    const boardConfig = JSON.parse(_boardConfig);
    if (boardConfig.header && boardConfig.header.headerText && typeof boardConfig.header.headerText === 'object') {
        boardConfig.header.headerText = boardConfig.header.headerText[lang] || '';
    }
    let boardExists = boardsToShow.filter(it => it.id === id);
    if (!boardExists.length) {
        let newBoard = {
            id: id,
            name: boardConfig.name,
            model: boardConfig.model,
            handle: mp.objects.createRenderTarget(boardConfig.name, boardConfig.model),
            header: boardConfig.header,
            columns: boardConfig.columns,
        };
        boardsToShow.push(newBoard);
    }
    else {
        mp.events.call("board:hide", id);
        mp.events.call("board:update", id, JSON.stringify(boardConfig));
    }
});
mp.rpc("board:hide", (id) => {
    let boardsToHide = boardsToShow.filter(board => board.id === id);
    if (boardsToHide.length) {
        const boardToHide = boardsToHide[0];
        boardsToShow.splice(boardsToShow.indexOf(boardToHide), 1);
    }
});
function drawHeader(header) {
    let res = mp.game.graphics.getScreenActiveResolution(0, 0);
    drawingHeaderSize = [header.headerFontSize / res.y * 720, header.headerFontSize / res.y * 720];
    mp.game.ui.setTextEntry("STRING");
    mp.game.ui.addTextComponentSubstringPlayerName(header.headerText);
    mp.game.ui.setTextFont(header.headerFontType);
    mp.game.ui.setTextScale(drawingHeaderSize[0], drawingHeaderSize[1]);
    mp.game.ui.setTextColour(drawingColor[0], drawingColor[1], drawingColor[2], drawingColor[3]);
    mp.game.ui.drawText(0.02, 0.02);
}
function drawColumns(columns) {
    let coordX = 0.05;
    let res = mp.game.graphics.getScreenActiveResolution(0, 0);
    for (let column of columns) {
        if (column.columnText && column.columnText.length) {
            for (let columnTextIdx in column.columnText) {
                let columnText = column.columnText[columnTextIdx];
                if (typeof columnText === "string" && columnText.length) {
                    drawingSize = [column.columnFontSize / res.y * 720, column.columnFontSize / res.y * 720];
                    mp.game.ui.setTextEntry("STRING");
                    mp.game.ui.addTextComponentSubstringPlayerName(columnText);
                    mp.game.ui.setTextFont(column.columnFontType);
                    mp.game.ui.setTextScale(drawingSize[0], drawingSize[1]);
                    mp.game.ui.setTextColour(drawingColor[0], drawingColor[1], drawingColor[2], drawingColor[3]);
                    mp.game.ui.drawText(coordX, drawingPos[1] + (nameSpace * parseInt(columnTextIdx)));
                }
            }
        }
        coordX += 0.15;
    }
}
function renderBoard(board) {
    if (board && board.handle) {
        mp.game.ui.setTextRenderId(board.handle);
        mp.game.graphics.set2dLayer(4);
        mp.game.graphics.drawRect(0.5, 0.5, 1, 1, 207, 216, 220, 255);
        drawHeader(board.header);
        drawColumns(board.columns);
        mp.game.ui.setTextRenderId(1);
    }
}
mp.events.add("render", () => {
    for (let board of boardsToShow) {
        renderBoard(board);
    }
});

}
board.js
{
const flipDict = "anim@mp_player_intcelebrationmale@wave", flipAnim = "wave";
mp.game.streaming.requestAnimDict(flipDict);
/** Flip coin start, spawn at tempPos and then is attached to the bone 0 and offset.
 * So, the coin have two possibles outcomes, heads or tails.
 * toRZ control the face of the coin (180 ° change sides), then there is a 50% chance that I touched you one side or the other.
 */
mp.rpc("player:flip_coin", (playerId, face, model) => {
    let player = mp.players.atRemoteId(playerId);
    if (!mp.players.exists(player) || !player.handle)
        return;
    if (playerId === mp.players.local.remoteId) {
        mp.game.audio.playSound(-1, "Bus_Schedule_Pickup", "DLC_PRISON_BREAK_HEIST_SOUNDS", true, 0, true);
        if (!player.vehicle) {
            player.taskPlayAnim(flipDict, flipAnim, 4.0, 4.0, 700, 4, 0, false, false, false);
        }
    }
    /** Variables */
    let x = 0.18, y = 0.42, z = 0.28;
    let toX = 0.05, toY = 0.07, toZ = 0.98;
    let rZ = 0;
    let toRX = 85, toRZ = face ? 1800 : 1980;
    let interval;
    let tempPos = player.position;
    /** Spawn under the ground */
    tempPos.z -= 15;
    let coin = mp.objects.new(model, tempPos, {
        rotation: new mp.Vector3(-85, 0, 180),
        dimension: player.dimension
    });
    setTimeout(() => {
        try {
            coin.attachTo(player.handle, 0, 0.13, 0.38, 0.19, -90, 0, 0, true, false, false, false, 0, true);
            /** Move the coin */
            interval = setInterval(() => {
                try {
                    if (!mp.objects.exists(coin) || !mp.players.exists(player) || !coin.handle || !player.handle)
                        return stopFlip(coin, interval);
                    if (z < toZ)
                        z += 0.02;
                    if (y > toY)
                        y -= 0.01;
                    if (x > toX)
                        x -= 0.01;
                    if (toRX > 0)
                        toRX -= 1;
                    rZ += 9;
                    coin.attachTo(player.handle, 0, x, y, z, toRX, 0, rZ, true, false, false, false, 0, true);
                    /** The face of the coin is at 0° and the cross at 180°, so it is ensured that when you finish turning it is showing one side. */
                    if (rZ == toRZ) {
                        clearInterval(interval);
                        setTimeout(() => {
                            try {
                                coin.destroy();
                            }
                            catch (e) {
                                stopFlip(coin, interval);
                            }
                        }, 4000);
                    }
                }
                catch (e) {
                    stopFlip(coin, interval);
                }
            }, 25);
        }
        catch (e) {
            stopFlip(coin, interval);
        }
    }, 500);
});
mp.rpc("player:flip_dice", (playerId, _rotation, model) => {
    let player = mp.players.atRemoteId(playerId);
    if (!mp.players.exists(player) || !player.handle)
        return;
    const rotation = JSON.parse(_rotation);
    if (playerId === mp.players.local.remoteId) {
        mp.game.audio.playSound(-1, "Bus_Schedule_Pickup", "DLC_PRISON_BREAK_HEIST_SOUNDS", true, 0, true);
        if (!player.vehicle) {
            player.taskPlayAnim(flipDict, flipAnim, 4.0, 4.0, 700, 4, 0, false, false, false);
        }
    }
    /** Variables */
    let x = 0.18, y = 0.42, z = 0.28;
    let toX = 0.05, toY = 0.07, toZ = 0.98;
    let interval;
    let tempPos = player.position;
    let millisSinceStart = 0;
    let rZ = 0, rX = 0;
    /** Spawn under the ground */
    tempPos.z -= 15;
    const dice = mp.objects.new(model, tempPos, {
        rotation: new mp.Vector3(-85, 0, 180),
        dimension: player.dimension
    });
    setTimeout(() => {
        try {
            dice.attachTo(player.handle, 0, 0.13, 0.38, 0.19, -90, 0, 0, true, false, false, false, 0, true);
            /** Move the dice */
            interval = setInterval(() => {
                try {
                    if (!mp.objects.exists(dice) || !mp.players.exists(player) || !dice.handle || !player.handle)
                        return stopFlip(dice, interval);
                    if (z < toZ)
                        z += 0.02;
                    if (y > toY)
                        y -= 0.01;
                    if (x > toX)
                        x -= 0.01;
                    rZ += 7;
                    rX += 1;
                    millisSinceStart += 25;
                    if (millisSinceStart >= 5500) {
                        dice.attachTo(player.handle, 0, x, y, z, rotation.x, rotation.y, rotation.z, true, false, false, false, 0, true);
                        clearInterval(interval);
                        setTimeout(() => {
                            try {
                                dice.destroy();
                            }
                            catch (e) {
                                stopFlip(dice, interval);
                            }
                        }, 4000);
                    }
                    else {
                        dice.attachTo(player.handle, 0, x, y, z, rX, 0, rZ, true, false, false, false, 0, true);
                    }
                }
                catch (e) {
                    stopFlip(dice, interval);
                }
            }, 25);
        }
        catch (e) {
            stopFlip(dice, interval);
        }
    }, 500);
});
function stopFlip(obj, interval) {
    if (mp.objects.exists(obj))
        obj.destroy();
    clearInterval(interval);
}

}
flipcoin.js
{
/// <reference path="../node_modules/@ragempcommunity/types-client/index.d.ts" />
const crouchStyle = "MOVE_PED_CROUCHED";
// apply clip sets if streamed player is crouching
mp.events.add("entityStreamIn", (entity) => {
    if (entity.type === "player") {
        if (entity.getVariable("isCrouched")) {
            mp.setWalkingStyle(entity, crouchStyle, 0);
        }
    }
});
// apply/reset clip sets when isCrouched changes for a streamed player
mp.events.addDataHandler("isCrouched", (entity, value) => {
    if (entity.type === "player" && entity.handle) {
        if (value) {
            mp.setWalkingStyle(entity, crouchStyle, 0);
        }
        else {
            mp.setWalkingStyle(entity, entity.walkStyle, 0);
        }
    }
});
mp.events.add("render", () => {
    // detect CTRL input, not use key bind because CTRL (0x11) is detect as ALT in some keyboard languages
    if (mp.game.controls.isControlJustPressed(0, 224)) {
        if (mp.players.local.vehicle || !mp.players.local.isVisible() || mp.gui.cursor.visible || mp.players.local.editing)
            return;
        mp.events.originalCallRemote("toggleCrouch");
    }
});

}
crouch.js
{
/**
 * Toggle record with F6
 */
mp.useInput(mp.input.TOGGLE_RECORD, false, () => {
    if (!mp.game.recorder.isRecording()) {
        mp.game.recorder.start(1);
    }
    else {
        mp.game.recorder.stop();
    }
});

}
recorder.js
items_camera.js
{
/**
    melee: 2685387236
    Handguns: 416676503
    Submachine Gun: 3337201093
    Shotgun: 860033945
    Assault Rifle: 970310034
    Light Machine Gun: 1159398588
    Sniper: 3082541095
    Heavy Weapon: 2725924767
    Throwables: 1548507267
    Misc: 4257178988
*/
const weaponsTypeToDisable = [416676503, 3337201093, 860033945, 970310034, 1159398588, 3082541095, 2725924767];
var player = mp.players.local;
mp.events.add("render", () => {
    let selectedWeapon = mp.game.invoke(`0x0A6DB4965674D243`, mp.players.local.handle); // GET_SELECTED_PED_WEAPON
    if (selectedWeapon !== -1569615261) {
        let typeOfWeapon = mp.game.weapon.getWeapontypeGroup(selectedWeapon); // Get type of weapon
        // check if current type of weapon need to be disabled, do it.
        if (weaponsTypeToDisable.includes(typeOfWeapon)) {
            let aiming = player.getConfigFlag(78, true);
            let shotting = player.isShooting();
            let reloading = player.isReloading();
            if (aiming || shotting || reloading) {
                mp.game.controls.disableControlAction(0, 22, true); //Space control
            }
        }
    }
});

}
disable_tumble.js
{
let countdownTimer = false;
let intervalCountEvent;
let startCount = 0;
mp.events.add("render", () => {
    // draw countdown timer
    if (countdownTimer) {
        mp.game.graphics.drawText(`${startCount}`, [0.5, 0.05], {
            font: 7,
            color: [52, 125, 245, 230],
            scale: [2.5, 2.5],
            outline: true
        });
        if (startCount === 0) {
            clearInterval(intervalCountEvent);
            intervalCountEvent = null;
            countdownTimer = false;
            mp.game.graphics.startScreenEffect("MP_SmugglerCheckpoint", 1000, false);
        }
    }
});
/** Timer with sound and screen text for [time] seconds, return true when finish */
mp.startTimer = function (time) {
    if (time === 0)
        return;
    if (countdownTimer)
        return;
    countdownTimer = true;
    startCount = time;
    if (startCount === 5)
        mp.game.audio.playSoundFrontend(-1, "5s", "MP_MISSION_COUNTDOWN_SOUNDSET", true); // if time is 5 seconds, start the sound effect
    if (intervalCountEvent)
        clearInterval(intervalCountEvent);
    intervalCountEvent = setInterval(() => {
        startCount--;
        // if the time was more than 5 seconds, it will start the sound when it reaches 5.
        if (startCount === 5)
            mp.game.audio.playSoundFrontend(-1, "5s", "MP_MISSION_COUNTDOWN_SOUNDSET", true);
    }, 1000);
};

}
countdown.js
localization.js
{
/**
* Get the cfg value for a key.
*
* @param {string} key The key to get the value for
*
* @returns {object} The value for the key
*/
function getCfgAsync(key) {
    return mp.requestRemote("cfg:get", key);
}
mp.getCfgAsync = getCfgAsync;

}
cfg.js
{
let screens = {};
function destroy(id, callback) {
    const screen = screens[id];
    if (screen !== undefined) {
        delete screens[id];
        setTimeout(() => {
            screen.browser.destroy();
            callback();
        }, 1000);
    }
    else {
        callback();
    }
}
function create(id, model, position, configStr) {
    const config = JSON.parse(configStr);
    if (screens[id] !== undefined) {
        //mp.events.call("cef_screen:destroy", config.id);
        //mp.events.call("cef_screen:create", config.id, model, position, configStr);
        destroy(config.id, () => {
            create(config.id, model, position, configStr);
        });
        return;
    }
    const rtid = mp.objects.createRenderTarget(config.renderTarget, model);
    if (rtid === -1)
        return;
    const finalUrl = config.url || "package://html/streaming.html";
    const browser = mp.browsers.newHeadless(finalUrl, config.width, config.height);
    browser.inputEnabled = false;
    if (config.source)
        browser.execute(`showOther("${config.source}", ${config.width}, ${config.height})`);
    screens[id] = { browser, position, config, isStreaming: false, rtid };
}
var locale = "es";
mp.rpc("player:set_server_language", (lang) => {
    locale = lang;
});
mp.rpc("cef_screen:create", (id, model, position, configStr) => {
    create(id, model, position, configStr);
});
mp.rpc("cef_screen:destroy", (id) => {
    destroy(id, () => { });
});
mp.rpc("cef_screen:play_streaming", (id, source, volume, secondsPassed, isPlaying) => {
    const screen = screens[id];
    if (screen !== undefined) {
        screen.browser.execute(`showYoutubeVideo("${source}", ${volume * mp.players.local.volume() * 100}, ${secondsPassed.toFixed()}, ${isPlaying}, "${screen.config.width}", "${screen.config.height}", "${locale}")`);
        setTimeout(() => {
            screen.isStreaming = true;
        }, 1000);
    }
});
mp.rpc("cef_screen:set_volume", (id, volume) => {
    const screen = screens[id];
    if (screen !== undefined) {
        const scaledVolume = Math.min(Math.round((volume <= 1 ? volume * 100 : volume) * mp.players.local.volume()), 100);
        screen.browser.execute(`setVolume(${scaledVolume})`);
    }
});
mp.rpc("sound:setVolume", (volume) => {
    for (const screen of Object.values(screens)) {
        if (screen.isStreaming) {
            const scaledVolume = Math.min(Math.round((volume <= 1 ? volume * 100 : volume) * mp.players.local.volume()), 100);
            screen.browser.execute(`setVolume(${scaledVolume})`);
        }
    }
});
mp.rpc("cef_screen:pause_streaming", (id) => {
    const screen = screens[id];
    if (screen !== undefined) {
        screen.browser.execute(`playStopVideo(false)`);
    }
});
mp.rpc("cef_screen:resume_streaming", (id, secondsPassed) => {
    const screen = screens[id];
    if (screen !== undefined) {
        screen.browser.execute(`playStopVideo(true, ${Math.floor(secondsPassed)})`);
    }
});
mp.rpc("cef_screen:eval", (id, code) => {
    const screen = screens[id];
    if (screen !== undefined) {
        screen.browser.execute(code);
    }
});
mp.events.add('render', () => {
    for (const screen of Object.values(screens)) {
        // TODO check if screen is near enough to player
        mp.game.ui.setTextRenderId(screen.rtid);
        mp.game.graphics.set2dLayer(4);
        mp.game.graphics.drawSprite(screen.browser.headlessTextureDict, screen.browser.headlessTextureName, 0.5, 0.5, // screen position
        1, 1 * screen.browser.headlessTextureHeightScale, // scale
        0, // heading
        255, 255, 255, 255 // color
        );
        mp.game.ui.setTextRenderId(1);
    }
});
const updateScreenSound = () => {
    if (Object.keys(screens).length == 0)
        return;
    const playerPos = mp.players.local.position;
    for (const screen of Object.values(screens)) {
        if (screen.isStreaming) {
            screen.browser.execute(`updateSound(${JSON.stringify(playerPos)}, ${JSON.stringify(screen.position)}, ${screen.config.radius})`);
        }
    }
};
mp.setInterval(updateScreenSound, 50);

}
cef_screen.js
{
const CREATE_COOLDOWN = 1000;
let nextCreate = 0;
let marker = null;
let markerConfig = {
    model: 2,
    scale: 1,
    color: {
        r: 33,
        g: 150,
        b: 243,
        a: 190
    },
    rotation: {
        x: 180,
        y: 0,
        z: 0
    }
};
let markerOffset = {
    x: 0,
    y: 0,
    z: 0.5
};
async function init() {
    const markerConfigServer = await mp.getCfgAsync("interaction:markerConfig");
    //mp.console.logInfo(`Received marker config: ${JSON.stringify(markerConfigServer)}`)
    if (markerConfigServer) {
        markerConfig = markerConfigServer;
    }
    const markerOffsetServer = await mp.getCfgAsync("interaction:markerPositionOffset");
    //mp.console.logInfo(`Received marker offset: ${JSON.stringify(markerOffsetServer)}`)
    if (markerOffsetServer) {
        markerOffset = markerOffsetServer;
    }
}
setTimeout(() => {
    init()
        .then(() => { })
        .catch(e => mp.console.logError(`Failed to initialize interaction markers: ${e}`));
}, 5000);
function destroyMarker() {
    if (marker) {
        marker.destroy();
        marker = null;
    }
}
mp.events.add("dialog:item_hover", (name, world, x, y, z) => {
    destroyMarker();
    if (Date.now() < nextCreate) {
        return;
    }
    const vector = new mp.Vector3(x + markerOffset.x, y + markerOffset.y, z + markerOffset.z);
    marker = mp.markers.new(markerConfig.model, vector, markerConfig.scale, {
        color: [markerConfig.color.r, markerConfig.color.g, markerConfig.color.b, markerConfig.color.a],
        rotation: new mp.Vector3(markerConfig.rotation.x, markerConfig.rotation.y, markerConfig.rotation.z),
        visible: true,
        dimension: world
    });
});
mp.events.add("dialog:on_response", () => {
    destroyMarker();
    nextCreate = Date.now() + CREATE_COOLDOWN;
});

}
dialog_pickup.js
{
async function isFeatureFlagEnabled(featureFlag) {
    try {
        return await mp.requestRemote("featureflag:isEnabled", featureFlag);
    }
    catch (error) {
        return false;
    }
}
async function isFeatureFlagEnabledGlobally(featureFlag) {
    try {
        return await mp.requestRemote("featureflag:isEnabledGlobally", featureFlag);
    }
    catch (error) {
        return false;
    }
}
mp.featureFlag = {
    isEnabled: isFeatureFlagEnabled,
    isEnabledGlobally: isFeatureFlagEnabledGlobally
};

}
featureflag.js
{
/** Implements HUD notifications */
let notifications = {};
mp.rpc('notification:show', (key, notificationJson) => {
    if (!(key in notifications)) {
        mp.game.audio.playSoundFrontend(2, "INFO", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
        notifications[key] = true;
    }
    mp.browserExecute("notificationsVM.notify(" + JSON.stringify(key) + "," + notificationJson + ");");
});
mp.rpc('notification:hide', (key) => {
    if (key in notifications) {
        delete notifications[key];
        mp.browserExecute("notificationsVM.dismiss(" + JSON.stringify(key) + ");");
    }
});
mp.rpc("top_notification:show", (notificationJson) => {
    mp.browserExecute(`notificationsVM.notifyTop(${notificationJson});`);
});
mp.rpc("top_notification:hide", () => {
    mp.browserExecute(`notificationsVM.dismissTop();`);
});

}
ui_notifications.js
ui_locationhud.js
{
System.register([], function (exports_1, context_1) {
    "use strict";
    var modelToHandling;
    var __moduleName = context_1 && context_1.id;
    function initHandlingReference(raw) {
        modelToHandling.clear();
        for (const modelStr of Object.keys(raw)) {
            const modelHash = Number(modelStr);
            const src = raw[modelStr]?.handling || {};
            // Build dense 0..38 array; fill missing with NaN
            const arr = [];
            for (let i = 0; i <= 38; i++) {
                const v = src[String(i)];
                arr[i] = v !== undefined ? parseFloat(v) : Number.NaN;
            }
            modelToHandling.set(modelHash, arr);
        }
    }
    exports_1("initHandlingReference", initHandlingReference);
    function getHandlingReference(modelHash) {
        return modelToHandling.get(modelHash);
    }
    exports_1("getHandlingReference", getHandlingReference);
    function hasHandlingReference(modelHash) {
        return modelToHandling.has(modelHash);
    }
    exports_1("hasHandlingReference", hasHandlingReference);
    return {
        setters: [],
        execute: function () {
            modelToHandling = new Map();
        }
    };
});

}
handling_reference
{
mp.rpc("keybinds:addMapping", (key, mapping) => {
    mp.mapKeybind(key, parseInt(mapping, 16));
});
mp.rpc("keybinds:set", (bindsJSON) => {
    const binds = JSON.parse(bindsJSON);
    for (const [input, bind] of Object.entries(binds)) {
        mp.console.logInfo(`input ${input} key ${bind.key} triggerOnRelease ${bind.triggerOnRelease}`);
        mp.input[input] = bind;
    }
});
mp.rpc("keybinds:setAll", (bindsJSON) => {
    const binds = JSON.parse(bindsJSON);
    if (Array.isArray(binds) && binds.length > 0) {
        for (let i = 0; i < binds.length; i++) {
            if (binds[i].key < 0x10) {
                binds[i].key = "0x0" + binds[i].key.toString(16).toUpperCase();
            }
            else {
                binds[i].key = "0x" + binds[i].key.toString(16).toUpperCase();
            }
        }
        let loadedBinds = JSON.stringify(binds);
        mp.setKeybinds(loadedBinds);
    }
    else {
        //mp.console.logInfo("No key binds to set or invalid data received.");
    }
});

}
keybinder.js
{
/** Toggle FPS counter with F8 */
function getFrameCount() {
    return mp.game.invoke('0xFC8202EFC642E6F2');
}
function getLastFps() {
    return fps;
}
let lastFrameCount = getFrameCount();
let counterEnabled = false;
let firstCall = false;
let fps = 0;
mp.setInterval(() => {
    fps = getFrameCount() - lastFrameCount;
    lastFrameCount = getFrameCount();
}, 1000);
mp.useInput(mp.input.FPS_COUNTER, true, () => {
    counterEnabled = !counterEnabled;
    if (counterEnabled && mp.players.local.duty) {
        mp.profiler.setEnabled(true);
    }
    else {
        mp.profiler.setEnabled(false);
    }
    if (!firstCall) {
        firstCall = true;
        mp.events.add("render", () => {
            if (counterEnabled) {
                mp.game.graphics.drawText("" + fps, [0.01, 0.005], {
                    font: 5,
                    color: [255, 255, 255, 185],
                    scale: [.3, .3],
                    outline: true
                });
            }
        });
    }
});

}
fpscounter.js
{
let KeysSkycam = {
    Up: 0x26,
    Down: 0x28,
    Left: 0x25,
    Right: 0x27,
    Space: 0x20,
    Alt: 0x12,
    Shift: 16,
    G: 0x47, // reset rotation
    Enter: 0x0D,
    Backspace: 0x08
};
let skyObj = null;
let skyCam = null;
let itemIndex = 0;
let lastFrameMsSkycam = 0;
let currentZoom = 0;
let objOffset = new mp.Vector3(0, 0, 0);
let skyPosition = new mp.Vector3(0, 0, 500);
function changeZoom(difference) {
    currentZoom = currentZoom - difference;
    skyObj.position = new mp.Vector3(skyPosition.x + objOffset.x, skyPosition.y + currentZoom, skyPosition.z + objOffset.z);
}
// player.call("skycam:set", "iifss", itemIndex, itemType.model, zoom, JSON.to(rot), JSON.to(offset))
mp.rpc("skycam:set", (index, model, initialZoom, initialRotationJson, initialOffsetJson) => {
    if (skyObj)
        skyObj.destroy();
    if (skyCam)
        skyCam.destroy();
    skyObj = mp.objects.new(model, skyPosition, { dimension: -1 });
    if (!skyObj) {
        mp.game.graphics.notify('invalid model ' + model + ".");
        return;
    }
    mp.game.ui.displayRadar(false);
    skyCam = mp.cameras.new('default', new mp.Vector3(skyPosition.x, skyPosition.y - 1, skyPosition.z), new mp.Vector3(0, 0, 0), 40);
    skyCam.pointAtCoord(skyPosition.x, skyPosition.y, skyPosition.z);
    skyCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    currentZoom = initialZoom;
    skyObj.rotation = JSON.parse(initialRotationJson);
    itemIndex = index;
    lastFrameMsSkycam = 0;
    objOffset = JSON.parse(initialOffsetJson);
    changeZoom(0);
});
//mp.events.call("skycam:set", 0, mp.game.joaat("prop_laptop_01a"), 1, JSON.stringify(new mp.Vector3(0, 0, 0)));
function cancel() {
    if (!skyObj)
        return;
    skyObj.destroy();
    skyCam.setActive(false);
    skyCam.destroy();
    skyObj = null;
    skyCam = null;
    mp.game.ui.displayRadar(true);
    mp.game.cam.renderScriptCams(false, true, 1000.0, true, false);
}
function threeDigitsSkycam(num) {
    if (num <= 9)
        return "00" + num;
    if (num <= 99)
        return "0" + num;
    return "" + num;
}
mp.useInput(mp.input.SKYCAM_SCREENSHOT, true, () => {
    if (!skyObj)
        return;
    if (itemIndex != -1) {
        mp.gui.takeScreenshot(threeDigitsSkycam(itemIndex) + ".png", 1, 100, 0);
    }
    mp.events.callRemote("skycam:save", currentZoom, JSON.stringify(skyObj.rotation), JSON.stringify(objOffset));
    cancel();
});
mp.useInput(mp.input.SKYCAM_BACK, true, () => {
    if (!skyObj)
        return;
    mp.events.callRemote("skycam:cancel");
    cancel();
});
mp.useInput(mp.input.SKYCAM_RESET, true, () => {
    if (!skyObj)
        return;
    skyObj.rotation = new mp.Vector3(0, 0, 0);
    objOffset = new mp.Vector3(0, 0, 0);
    currentZoom = 1.0;
    changeZoom(0);
});
// change zoom
mp.events.add('click', (x, y, upOrDown, leftOrRight, relativeX, relativeY, worldPosition, hitEntity) => {
    if (!skyObj)
        return;
    if (upOrDown == "down") {
        if (leftOrRight === 'left') {
            changeZoom(0.03);
        }
        else {
            changeZoom(-0.03);
        }
    }
});
// change rotation
mp.events.add("render", () => {
    if (!skyObj)
        return;
    let time = new Date().getTime();
    if (lastFrameMsSkycam === 0)
        lastFrameMsSkycam = time;
    let delta = (time - lastFrameMsSkycam) / 1000.0; // delta in seconds.
    lastFrameMsSkycam = time;
    let up = mp.keys.isDown(KeysSkycam.Up);
    let down = mp.keys.isDown(KeysSkycam.Down);
    let left = mp.keys.isDown(KeysSkycam.Left);
    let right = mp.keys.isDown(KeysSkycam.Right);
    let shift = mp.keys.isDown(KeysSkycam.Shift);
    let space = mp.keys.isDown(KeysSkycam.Space);
    let objToEdit = skyObj.rotation;
    let m = 30 * delta;
    // Space (edit offset)
    if (space) {
        m = .12 * delta;
        if (right) {
            objOffset.x = objOffset.x + m;
        }
        else if (left) {
            objOffset.x = objOffset.x - m;
        }
        if (up) {
            objOffset.z = objOffset.z + m;
        }
        else if (down) {
            objOffset.z = objOffset.z - m;
        }
        changeZoom(0); // update offset
    }
    // Shift (up/down)
    if (up && !shift) {
        objToEdit.x = objToEdit.x - m;
    }
    else if (down && !shift) {
        objToEdit.x = objToEdit.x + m;
    }
    // Regular xy movement
    if (up && shift) {
        objToEdit.y = objToEdit.y + m;
    }
    else if (down && shift) {
        objToEdit.y = objToEdit.y - m;
    }
    if (left) {
        objToEdit.z = objToEdit.z - m;
    }
    else if (right) {
        objToEdit.z = objToEdit.z + m;
    }
    skyObj.rotation = objToEdit;
});

}
skycam.js
{
// Functions for items, for example to disable weapon switch and things like that
let currentWeaponHash;
let currentWeaponUnsigned = null;
const UNARMED_HASH = 2725352035;
const IGNORE_RECOIL = [
    mp.game.joaat("weapon_petrolcan"),
    mp.game.joaat("weapon_hazardcan"),
    mp.game.joaat("weapon_fertilizercan")
];
mp.game.weapon.unequipEmptyWeapons = false; // don't unequip weapons when they are empty
mp.players.local.setCanSwitchWeapon(false);
let petrolCanCooldown = 0;
mp.events.add('playerWeaponShot', (a, b) => {
    let player = mp.players.local;
    if (player.weapon === currentWeaponUnsigned || player.weapon === UNARMED_HASH) {
        let ammoInClip = player.getAmmoInClip(currentWeaponHash);
        // only report every second for petrol can because the game freeze/crash if report every 'shot'
        if (IGNORE_RECOIL.indexOf(player.weapon) > -1) {
            if (Date.now() - petrolCanCooldown < 500)
                return;
            petrolCanCooldown = Date.now();
        }
        mp.events.callRemote("items:on_fire", ammoInClip ? ammoInClip : 0);
    }
});
mp.rpc("player:give_weapon", (weaponHash, ammo) => {
    currentWeaponHash = weaponHash;
    currentWeaponUnsigned = weaponHash >>> 0;
});
mp.rpc("player:apply_weapon_component", (weaponInt, componentInt) => {
    if (mp.players.local.weapon === UNARMED_HASH)
        return;
    mp.game.invoke("0xD966D51AA5B28BB9", mp.players.local.handle, weaponInt, componentInt);
});
mp.rpc("player:apply_weapon_tint", (weaponInt, tintIndex) => {
    if (mp.players.local.weapon === UNARMED_HASH)
        return;
    mp.game.invoke("0x50969B9B89ED5738", mp.players.local.handle, weaponInt, tintIndex);
});
mp.rpc("player:apply_weapon_livery", (weaponInt, comHash, index) => {
    if (mp.players.local.weapon === UNARMED_HASH)
        return;
    mp.game.invoke("0xD966D51AA5B28BB9", mp.players.local.handle, weaponInt, comHash);
    mp.game.invoke("0x9FE5633880ECD8ED", mp.players.local.handle, weaponInt, comHash, index);
});
mp.rpc("player:remove_weapons", () => {
    currentWeaponHash = null;
    currentWeaponUnsigned = null;
});
mp.rpc("player:jam_weapon", (weaponInt) => {
    if (weaponInt === currentWeaponHash) {
        const player = mp.players.local;
        mp.game.weapon.setPedAmmo(player.handle, currentWeaponHash, 0, false);
    }
});
mp.events.add("render", () => {
    mp.game.controls.disableControlAction(24, 157, true); // tab weapon wheel
    mp.game.controls.disableControlAction(24, 37, true); // switch weapon wheel
    mp.game.controls.disableControlAction(1, 45, true); // reload
    mp.game.controls.disableControlAction(1, 140, true); // input melee attack
});
// some recoil on shot
let recoilCounter = 0;
mp.events.add('playerWeaponShot', (targetPosition, targetEntity) => {
    if (IGNORE_RECOIL.indexOf(mp.players.local.weapon) > -1)
        return;
    mp.game.cam.shakeGameplayCam('JOLT_SHAKE', (recoilCounter + 1) * 0.2);
    recoilCounter = Math.min(recoilCounter + 1, 4);
});
mp.setInterval(() => {
    if (recoilCounter > 0)
        recoilCounter--;
}, 200);

}
items.js
{
const NativeUI = require("nativeui");
const Menu = NativeUI.Menu;
const UIMenuItem = NativeUI.UIMenuItem;
const UIMenuListItem = NativeUI.UIMenuListItem;
const Point = NativeUI.Point;
const ItemsCollection = NativeUI.ItemsCollection;
const ListItem = NativeUI.ListItem;
let existingUi = null;
mp.rpc("clothesedit:edit", (isProp, index, drawableId, drawableDataJson) => {
    if (existingUi) {
        existingUi.Close();
    }
    let drawableData = JSON.parse(drawableDataJson);
    existingUi = new Menu("Editar " + index, "Indice " + drawableId, new Point(50, 500));
    const listOfMany = [];
    const nameListEn = [drawableData.name.en];
    const nameListEs = [drawableData.name.es];
    for (let i = 0; i < 400; i++)
        listOfMany.push(i.toString());
    mp.console.logInfo(JSON.stringify(drawableData));
    let txtNum = new UIMenuListItem("Max txt", "", new ItemsCollection(listOfMany), drawableData.maxTextures);
    let torsoNum = new UIMenuListItem("Torso", "", new ItemsCollection(listOfMany), drawableData.torso);
    let undershirtNum = new UIMenuListItem("Undershirt", "", new ItemsCollection(listOfMany), drawableData.undershirt);
    // Pants needs to be listOfMany + -1 because -1 disables pants in tops
    let legsNum = new UIMenuListItem("Legs", "", new ItemsCollection(["-1", ...listOfMany]), drawableData.legs + 1);
    let nameOptEn = new UIMenuListItem("Name EN", "", new ItemsCollection(nameListEn), 0);
    let nameOptEs = new UIMenuListItem("Name ES", "", new ItemsCollection(nameListEs), 0);
    existingUi.AddItem(txtNum);
    existingUi.AddItem(torsoNum);
    existingUi.AddItem(undershirtNum);
    existingUi.AddItem(legsNum);
    existingUi.AddItem(nameOptEn);
    existingUi.AddItem(nameOptEs);
    existingUi.ItemSelect.on((item) => {
        let result = {
            maxTextures: parseInt(txtNum.SelectedItem.DisplayText),
            torso: parseInt(torsoNum.SelectedItem.DisplayText),
            undershirt: parseInt(undershirtNum.SelectedItem.DisplayText),
            legs: parseInt(legsNum.SelectedItem.DisplayText),
        };
        mp.events.callRemote("clothesedit:on_accept", JSON.stringify(result), item === nameOptEn, item === nameOptEs);
        setTimeout(() => {
            existingUi.Close();
            existingUi = null;
        }, 1);
    });
    existingUi.ListChange.on((item, idx) => {
        if (isProp) {
            mp.players.local.setPropIndex(index, drawableId, parseInt(txtNum.SelectedItem.DisplayText), true);
        }
        else {
            mp.players.local.setComponentVariation(3, parseInt(torsoNum.SelectedItem.DisplayText), 0, 2);
            mp.players.local.setComponentVariation(8, parseInt(undershirtNum.SelectedItem.DisplayText), 0, 2);
            mp.players.local.setComponentVariation(index, drawableId, parseInt(txtNum.SelectedItem.DisplayText), 2);
            // Legs is special, -1 disables pants in tops
            let legs = parseInt(legsNum.SelectedItem.DisplayText);
            if (legs > -1) {
                mp.players.local.setComponentVariation(4, parseInt(legsNum.SelectedItem.DisplayText), 0, 2);
            }
        }
    });
    existingUi.MenuClose.on(() => {
        setTimeout(() => {
            if (existingUi) {
                existingUi.Close();
                existingUi = null;
            }
        }, 1);
    });
    if (isProp) {
        mp.players.local.setPropIndex(index, drawableId, drawableData.maxTextures, true);
    }
    else {
        mp.players.local.setComponentVariation(3, drawableData.torso, 0, 2);
        mp.players.local.setComponentVariation(8, drawableData.undershirt, 0, 2);
        if (drawableData.legs > -1) {
            mp.players.local.setComponentVariation(4, drawableData.legs, 0, 2);
        }
        mp.players.local.setComponentVariation(index, drawableId, drawableData.maxTextures, 2);
    }
    existingUi.Open();
});

}
clothesedit.js
nativeui
{
let labelsEnabled = true;
mp.rpc("player:set_admin_duty", (id, duty, showLabel) => {
    let staff = mp.players.atRemoteId(id);
    if (!staff)
        return;
    staff.duty = duty;
    staff.showLabel = showLabel;
});
let labelCooldown = 0;
mp.events.add("render", () => {
    let p = mp.players.local;
    if (mp.players.local.duty && mp.game.controls.isControlPressed(0, 21) && mp.keys.isDown(82) && Date.now() - labelCooldown > 1500) {
        labelCooldown = Date.now();
        labelsEnabled = !labelsEnabled;
    }
    // Draw info about players if admin is duty with labels enabled
    if (p.duty && labelsEnabled) {
        mp.players.forEachInStreamRange(p2 => {
            if (!mp.players.exists(p2) || !p2.handle)
                return;
            if (p !== p2) {
                let userInfo = getColor(p2);
                userInfo += `ID ${p2.remoteId} ${p2.name.replace("_", " ")} ${p2.getHealth()}HP`;
                if (p2.weapon !== 2725352035) {
                    userInfo += ` ${p2.getAmmoInClip(p2.weapon)}WA`;
                }
                if (p2.getSpeed() * 3.6 > 26) {
                    userInfo += ` ${(p2.getSpeed() * 3.6).toFixed(0)}KMH`;
                }
                if (p2.vehicle) {
                    userInfo += ` ${p2.vehicle.getEngineHealth()}VH`;
                }
                mp.game.graphics.drawText(userInfo.toUpperCase(), [p2.position.x, p2.position.y, p2.position.z], {
                    font: 4,
                    color: [255, 255, 255, 190],
                    scale: [0.35, 0.35],
                    outline: true,
                });
            }
        });
    }
});
/** Colors:
 * Red: shooting
 * Orange: aiming
 * Yellow: weapon selected
 * Green: in combat
 * White: normal state
 */
function getColor(user) {
    if (user.getConfigFlag(58, true) && user.weapon !== 2725352035) {
        return `~r~`;
    }
    else if (user.getConfigFlag(78, true)) {
        return `~o~`;
    }
    else if (user.weapon !== 2725352035) {
        return `~y~`;
    }
    else if (user.isInMeleeCombat() || user.isUsingActionMode()) {
        return `~g~`;
    }
    else
        return `~w~`;
}
function getGroundZ(pos) {
    return new Promise((resolve, reject) => {
        let newZ = 0;
        let interval = setInterval(async () => {
            newZ++;
            pos.z = mp.game.gameplay.getGroundZFor3dCoord(pos.x, pos.y, newZ * 1000, false, false);
            if (pos.z % 1 !== 0 || newZ >= 5) {
                pos.z += 2;
                clearInterval(interval);
                resolve(pos);
            }
        }, 500);
    });
}
mp.events.add("playerCreateWaypoint", async (position) => {
    if (mp.players.local.duty) {
        mp.players.local.position = position;
        mp.players.local.freezePosition(true);
        let newPos = await getGroundZ(position);
        mp.players.local.freezePosition(false);
        mp.players.local.position = newPos;
    }
});

}
ui_adminduty.js
{
var player = mp.players.local;
let welcomescene_translations = {};
let jet = 0;
let pedplayer = false;
let renderEvent = null;
let cinematicName = "";
let cinematicEndInterval = null;
// set the language
mp.rpc("player:set_server_language", (lang) => {
    welcomescene_translations = mp.getTranslations(['welcome1', 'welcome2'], lang);
});
// call to finish the cutscene
mp.events.add("doneCutscene", () => {
    mp.game.audio.triggerMusicEvent("FM_INTRO_DRIVE_END");
    mp.game.invoke("0xD220BDD222AC4A1E"); // STOP_CUTSCENE_IMMEDIATELY
    player.setAlpha(255);
    player.setInvincible(false);
    mp.game.invoke("0xEA1C610A04DB6BBB", pedplayer, false, false); // SET_ENTITY_VISIBLE
    // Hide Ped (Deleting Ped crashes Game)
    setTimeout(() => mp.game.cam.doScreenFadeIn(1000), 9000);
    // destroy render event
    if (renderEvent) {
        renderEvent.destroy();
        renderEvent = null;
    }
    mp.toggleHud(true);
});
mp.rpc("player:run_welcome_cinematic", (name, millis) => {
    cinematicName = name;
    // hide hud
    mp.toggleHud(false);
    if (millis < 15000)
        millis = 15000;
    // fire a timer that:
    // - 10 secs before, fade out the string
    // - 500ms after that, ends the cutscene
    setTimeout(() => {
        mp.game.cam.doScreenFadeOut(500);
        setTimeout(() => mp.events.call("doneCutscene"), 500);
    }, millis - 9500);
    // run the cinematic
    mp.events.call("run_welcome_cinematic");
});
mp.events.add("run_welcome_cinematic", async () => {
    mp.game.cam.doScreenFadeOut(0);
    //create hud ready for them to spawn
    mp.game.time.advanceClockTimeTo(19, 30, 0);
    mp.game.audio.setAudioFlag("DisableFlightMusic", true);
    player.clearTasksImmediately();
    player.position = new mp.Vector3(-1117.778, -1557.625, 3.3819);
    player.setInvincible(true);
    mp.game.audio.prepareMusicEvent("FM_INTRO_START");
    //Clone Current Ped
    const pedplayer = mp.game.invoke("0xEF29A16337FACADB", player.handle, 0, false, false);
    //Make Player Invisible
    player.setAlpha(0);
    mp.game.cam.renderScriptCams(false, false, 0, false, false);
    mp.game.cutscene.requestCutscene("mp_intro_concat", 1);
    while (!mp.game.cutscene.hasThisCutsceneLoaded("mp_intro_concat")) {
        await mp.game.waitAsync(0);
    }
    //Render Jet
    const hash = mp.game.joaat("p_cs_mp_jet_01_s");
    jet = mp.game.object.createObject(hash, -1200, -1490, 142.385, false, true, false);
    mp.game.invoke("0x3910051CCECDB00C", jet, false); // _SET_ENTITY_CLEANUP_BY_ENGINE
    mp.game.invoke("0xEA1C610A04DB6BBB", jet, true, false); // SET_ENTITY_VISIBLE
    // Attach Jet to Cutscene
    mp.game.cutscene.registerEntityForCutscene(jet, "MP_Plane", 0, 0, 0);
    if (player.model === 1885233650) {
        // Remove Female NPC from Cutscene
        mp.game.cutscene.registerEntityForCutscene(0, "MP_Female_Character", 3, mp.game.joaat("mp_f_freemode_01"), 0);
        mp.game.cutscene.registerEntityForCutscene(pedplayer, "MP_Male_Character", 0, 0, 0);
    }
    else {
        // Remove Male NPC from Cutscene
        mp.game.cutscene.registerEntityForCutscene(0, "MP_Male_Character", 3, mp.game.joaat("mp_m_freemode_01"), 0);
        mp.game.cutscene.registerEntityForCutscene(pedplayer, "MP_Female_Character", 0, 0, 0);
    }
    mp.game.invoke("0xEA1C610A04DB6BBB", pedplayer, true, false); // SET_ENTITY_VISIBLE
    for (let i = 1; i < 8; i++) {
        mp.game.cutscene.registerEntityForCutscene(0, "MP_Plane_Passenger_" + i, 3, mp.game.joaat("mp_m_freemode_01"), 0);
        mp.game.invoke("0x4C61C75BEE8184C2", "MP_Plane_Passenger_" + i, 0, 0); // SET_CUTSCENE_ENTITY_STREAMING_FLAGS
    }
    mp.game.invoke("0xE532F5D78798DAAB", hash); // SET_MODEL_AS_NO_LONGER_NEEDED
    setTimeout(() => {
        mp.game.cutscene.startCutscene(4);
        mp.game.invoke("0xBEB2D9A1D9A8F55A", 9, 9, 9, 9); //Idk what is it (namespace STREAMING)
        mp.game.cam.doScreenFadeIn(500);
        mp.game.audio.triggerMusicEvent("FM_INTRO_START");
    }, 500);
    /** Welcome text in screen */
    if (renderEvent)
        renderEvent.destroy();
    renderEvent = mp.events.add("render", () => {
        const time = mp.game.invoke("0xE625BEABBAFFDAB9"); // GET_CUTSCENE_TIME
        if (time !== 0) {
            if (time > 12000 && time < 22000) {
                mp.game.graphics.drawText(`${welcomescene_translations['welcome1']}` + cinematicName.replace("_", " "), [0.19895833730697632, 0.1657407432794571], {
                    font: 4,
                    color: [255, 255, 255, 255],
                    scale: [0.8, 0.8],
                    outline: true
                });
                mp.game.graphics.drawText(`${welcomescene_translations['welcome2']}`, [0.20208333432674408, 0.09351851791143417], {
                    font: 4,
                    color: [255, 255, 255, 255],
                    scale: [0.8, 0.8],
                    outline: true
                });
            }
        }
    });
});

}
ui_welcomescene.js
{
/**
 * This file contains an interface to spawn an arbitrary URL view to the player.
 */
// create/destroy URL data
mp.rpc("url:create", (title, urlData) => {
    mp.browserSet("urlVM", "title", title);
    mp.browserSet("urlVM", "url", JSON.parse(urlData));
    mp.browserSet("urlVM", "show", true);
    mp.enableUI("url", true, true, true);
});
mp.rpc("url:destroy", () => {
    if (mp.isUIEnabled("url")) {
        mp.browserSet("urlVM", "show", false);
        mp.disableUI("url");
    }
});
/** Close CEF button */
mp.events.add("url:on_close", () => {
    if (mp.getTopUI() != "url")
        return;
    mp.events.callRemote("url:on_close");
});

}
ui_url.js
{
let colors = [
    "~b~",
    "~w~",
    "~g~",
    "~y~",
    "~p~",
    "~o~"
];
mp.rpc("license:create", (licenseDataJSON) => {
    let licenseData = JSON.parse(licenseDataJSON);
    for (let color of colors) {
        if (licenseData.address.includes(color))
            licenseData.address = licenseData.address.replaceAll(color, "");
    }
    mp.browserSet("licenseVM", "licenseData", licenseData);
    mp.browserCall("licenseVM", "toggle", true);
});
mp.rpc("license:destroy", () => {
    mp.browserCall("licenseVM", "toggle", false);
});

}
ui_license.js
{
let warningType = {
    lag: "fa fa-exclamation-triangle"
};
mp.rpc("warning:show", (type, time) => {
    let icon = warningType[type];
    if (icon) {
        mp.browserCall("warningsVM", "toggleWarning", true, icon);
    }
    setTimeout(() => {
        mp.browserCall("warningsVM", "toggleWarning", false, icon);
    }, time);
});

}
ui_warnings.js
{
mp.rpc("padlock:toggle", (toggle) => {
    mp.browserCall("padlockVM", "toggleLock", toggle);
    if (toggle) {
        mp.enableUI("padlock", true, true, true);
    }
    else {
        mp.disableUI("padlock");
    }
});
mp.rpc("padlock:on_response", (input) => {
    if (input !== -1)
        mp.events.callRemote("padlock:on_response", input);
    else
        mp.events.callRemote("padlock:on_close");
});
mp.rpc("padlock:shake", (locked) => {
    mp.browserCall("padlockVM", "shake", locked);
});

}
ui_padlock.js
{
var player = mp.players.local;
let isTyping = false;
let distanceToDraw = 12.25;
const TYPINGTEXTS = [".", "..", "..."];
// Default T
mp.useInput(mp.input.CHAT, true, () => {
    setTimeout(() => {
        if (mp.isUIEnabled("chat") && !isTyping) {
            isTyping = true;
            mp.events.originalCallRemote('ui_headchat:toggle', true);
        }
    }, 500);
});
mp.events.add("chat:on_cancel", () => {
    isTyping = false;
    mp.events.originalCallRemote('ui_headchat:toggle', false);
});
mp.events.add("render", () => {
    // check nearby players to draw head chat label
    mp.players.forEachInStreamRange(playerNearby => {
        if (playerNearby !== player && mp.players.exists(playerNearby) && playerNearby.handle) {
            if (isInRangeOfPoint(distanceToDraw, playerNearby.position)) {
                // if player is typing
                if (playerNearby.getVariable('typing')) {
                    // create text effect in head: . -> .. -> ...
                    let point = TYPINGTEXTS[Math.round(Date.now() / 1000) % 3];
                    mp.game.graphics.drawText(point, [playerNearby.position.x, playerNearby.position.y, playerNearby.position.z + 1.0], {
                        font: 7,
                        color: [255, 255, 255, 200],
                        scale: [0.5, 0.5],
                        outline: true
                    });
                }
            }
        }
    });
});
function isInRangeOfPoint(distance, targetPosition) {
    return (mp.game.system.vdist2(player.position.x, player.position.y, player.position.z, targetPosition.x, targetPosition.y, targetPosition.z) <= distance);
}

}
ui_headchat.js
{
/** UI that lets you accept/reject a request. */
mp.rpc("whitelist:show", (stepsJSON, maxFails, maxSeconds) => {
    mp.enableUI("whitelist", true, true, true);
    mp.browserCall("whitelistVM", "enable", maxFails, maxSeconds, stepsJSON);
});
mp.rpc("whitelist:hide", () => {
    mp.browserCall("whitelistVM", "disable");
    mp.disableUI("whitelist");
});
mp.events.add("whitelist:on_finish", (fails) => {
    mp.events.callRemote("whitelist:on_finish", fails);
});
mp.events.add("whitelist:on_fail", (fails, secondsPassed) => {
    mp.events.callRemote("whitelist:on_fail", fails, secondsPassed);
});

}
{
const kindFunctions = [
    function (id) { return mp.players.atRemoteId(id); }, // 0 - players
    function (id) { return mp.vehicles.atRemoteId(id); }, // 1 - vehicles
    function (id) { return mp.objects.atJoebillId(id); }, // 2 - objects
    function (id) { return mp.markers.atJoebillId(id); }, // 3 - pickups
    function (id) { return mp.peds.atJoebillId(id); }, // 4 - actors
    function (id) { return mp.blips.atJoebillId(id); }, // 5 - blips
    function (id) { return mp.labels.atJoebillId(id); }, // 6 - labels
    // Ids above 5 are not implemented as game entities directly,
    // thus cannot be get from a pool. And don't need to, there's
    // no practical use for attaching entities to those types.
];
/** Returns the entity for the given kind and id. */
mp.getEntityForKindAndId = function (kind, id) {
    if (kind < kindFunctions.length && kind >= 0) {
        return kindFunctions[kind](id);
    }
    return undefined;
};
/** Returns the entity kinds type */
mp.getEntityKind = function (type) {
    switch (type) {
        case "player": return 0;
        case "vehicle": return 1;
        case "object": return 2;
        case "marker": return 3;
        case "ped": return 4;
        case "blip": return 5;
        case "label": return 6;
        default: return undefined;
    }
};
/** Returns the entity remote id */
mp.getEntityRemoteId = function (entity) {
    switch (entity.kind) {
        case 2: return mp.objects.atHandle(entity.handle).remoteID;
        case 4: return mp.peds.atHandle(entity.handle).joebillId;
        case 6: return entity.joebillId; // label
        default: return entity.remoteId;
    }
};

}
pools.js
{
const TOWTRUCKS = [
    mp.game.joaat("towtruck"),
    mp.game.joaat("towtruck2"),
    mp.game.joaat("towtruck4")
];
const TRUCKS = [
    mp.game.joaat("hauler"),
    mp.game.joaat("hauler2"),
    mp.game.joaat("packer"),
    mp.game.joaat("phantom"),
    mp.game.joaat("phantom3"),
];
// Get if model is a towtruck (true or false)
mp.isTowTruck = function (model) {
    return TOWTRUCKS.includes(model);
};
// Get if model is a truck (true or false)
mp.isTruck = function (model) {
    return TRUCKS.includes(model);
};
function tryFunction(identifier, func) {
    try {
        return func();
    }
    catch (e) {
        mp.console.logWarning(`${identifier}: ${e.stack.toString()}`);
        return null;
    }
}

}
vehicleutil.js
{
class VehicleDamage {
    // In theory this constructor is never used
    constructor(customDamage = undefined) {
        this.windows = {
            window0: customDamage?.windows?.window0 || false,
            window1: customDamage?.windows?.window1 || false,
            window2: customDamage?.windows?.window2 || false,
            window3: customDamage?.windows?.window3 || false,
            window4: customDamage?.windows?.window4 || false,
            window5: customDamage?.windows?.window5 || false,
            window6: customDamage?.windows?.window6 || false,
            window7: customDamage?.windows?.window7 || false,
        };
        this.wheels = {
            wheel0: customDamage?.wheels?.wheel0 || false, // wheel_lf / bike, plane or jet front
            wheel1: customDamage?.wheels?.wheel1 || false, // wheel_rf
            wheel2: customDamage?.wheels?.wheel2 || false, // wheel_lm / in 6 wheels trailer, plane or jet is first one on left
            wheel3: customDamage?.wheels?.wheel3 || false, // wheel_rm / in 6 wheels trailer, plane or jet is first one on right
            wheel4: customDamage?.wheels?.wheel4 || false, // wheel_lr / bike rear / in 6 wheels trailer, plane or jet is last one on left
            wheel5: customDamage?.wheels?.wheel5 || false, // wheel_rr / in 6 wheels trailer, plane or jet is last one on right
            wheel6: customDamage?.wheels?.wheel6 || false, // 6 wheels trailer mid wheel left
            wheel7: customDamage?.wheels?.wheel7 || false, // 6 wheels trailer mid wheel right
        };
        this.doors = {
            door0: customDamage?.doors?.door0 || false, // front left
            door1: customDamage?.doors?.door1 || false, // front right
            door2: customDamage?.doors?.door2 || false, // back left
            door3: customDamage?.doors?.door3 || false, // back right
            door4: customDamage?.doors?.door4 || false, // hood
            door5: customDamage?.doors?.door5 || false, // trunk
        };
        this.deformations = {
            inFront: customDamage?.deformations?.inFront || 0.0,
            inBack: customDamage?.deformations?.inBack || 0.0,
            headlightLeft: customDamage?.deformations?.headlightLeft || false,
            headlightRight: customDamage?.deformations?.headlightRight || false,
            taillightLeft: customDamage?.deformations?.taillightLeft || false,
            taillightRight: customDamage?.deformations?.taillightRight || false
        };
    }
}
mp.vehicleDamageNeedsFix = function (damage, prevDamage) {
    for (let i = 0; i < Object.keys(damage.windows).length; i++) {
        let key = `window${i}`;
        if (!damage.windows[key] && prevDamage.windows[key]) {
            return true;
        }
    }
    for (let i = 0; i < Object.keys(damage.doors).length; i++) {
        let key = `door${i}`;
        if (!damage.doors[key] && prevDamage.doors[key]) {
            return true;
        }
    }
    if (!damage.deformations.headlightLeft && prevDamage.deformations.headlightLeft) {
        return true;
    }
    if (!damage.deformations.headlightRight && prevDamage.deformations.headlightRight) {
        return true;
    }
    if (!damage.deformations.taillightLeft && prevDamage.deformations.taillightLeft) {
        return true;
    }
    if (!damage.deformations.taillightRight && prevDamage.deformations.taillightRight) {
        return true;
    }
    return false;
};
mp.getVehicleDamage = function (vehicle) {
    let damage = new VehicleDamage();
    const isBike = (mp.game.vehicle.isThisModelABicycle(vehicle.model) ||
        mp.game.vehicle.isThisModelABike(vehicle.model) ||
        mp.game.vehicle.isThisModelAQuadbike(vehicle.model));
    const seats = vehicle.getMaxNumberOfPassengers() + 1;
    // get windows
    if (!isBike) {
        for (let window = 0; window < Object.keys(damage.windows).length; window++) {
            if (!isWindowIntact(vehicle, window) && (window < 2 || window > 3 || seats !== 2)) {
                damage.windows[`window${window}`] = true;
            }
        }
        // auto-fix window 4 and 5 (dont know what windows are)
        damage.windows.window4 = false;
        damage.windows.window5 = false;
        // get doors
        for (let door = 0; door < Object.keys(damage.doors).length; door++) {
            if (isValidDoor(vehicle, door) === 1) {
                if (vehicle.isDoorDamaged(door)) {
                    damage.doors[`door${door}`] = true;
                }
            }
        }
        // backlights not for bikes
        const coords_r = vehicle.getWorldPositionOfBone(vehicle.getBoneIndexByName('taillight_r'));
        const coords_l = vehicle.getWorldPositionOfBone(vehicle.getBoneIndexByName('taillight_l'));
        damage.deformations.taillightRight = vehicle.getBoneIndexByName('taillight_r') !== -1 && Math.floor(coords_r.x) === 0;
        damage.deformations.taillightLeft = vehicle.getBoneIndexByName('taillight_l') !== -1 && Math.floor(coords_l.x) === 0;
    }
    // get headlights
    damage.deformations.headlightLeft = vehicle.getBoneIndexByName('headlight_l') !== -1 && !!vehicle.getIsLeftHeadlightDamaged();
    damage.deformations.headlightRight = vehicle.getBoneIndexByName('headlight_r') !== -1 && !!vehicle.getIsRightHeadlightDamaged();
    return damage;
};
/** Applies VehicleDamage into vehicle. */
mp.applyVehicleDamage = function (vehicle, damage, prevDamage = null) {
    if (!prevDamage)
        prevDamage = new VehicleDamage();
    // apply windows
    for (let i = 0; i < Object.keys(damage.windows).length; i++) {
        let key = `window${i}`;
        if (damage.windows[key] && !prevDamage.windows[key]) {
            mp.game.invoke('0xA711568EEDB43069', vehicle.handle, i); // REMOVE_VEHICLE_WINDOW
        }
    }
    // apply doors
    for (let i = 0; i < Object.keys(damage.doors).length; i++) {
        let key = `door${i}`;
        if (damage.doors[key] && !prevDamage.doors[key]) {
            vehicle.setDoorBroken(i, true);
        }
    }
    // apply headlights
    if (damage.deformations.headlightLeft && !prevDamage.deformations.headlightLeft) {
        let coords_l = vehicle.getWorldPositionOfBone(vehicle.getBoneIndexByName('headlight_l'));
        let offset_l = vehicle.getOffsetFromGivenWorldCoords(coords_l.x, coords_l.y, coords_l.z);
        vehicle.setDamage(offset_l.x, offset_l.y, offset_l.z, 500, 10, true);
    }
    if (damage.deformations.headlightRight && !prevDamage.deformations.headlightRight) {
        let coords_r = vehicle.getWorldPositionOfBone(vehicle.getBoneIndexByName('headlight_r'));
        let offset_r = vehicle.getOffsetFromGivenWorldCoords(coords_r.x, coords_r.y, coords_r.z);
        vehicle.setDamage(offset_r.x, offset_r.y, offset_r.z, 500, 10, true);
    }
    // apply taillights
    if (damage.deformations.taillightLeft && !prevDamage.deformations.taillightLeft) {
        let coords_l = vehicle.getWorldPositionOfBone(vehicle.getBoneIndexByName('taillight_l'));
        let offset_l = vehicle.getOffsetFromGivenWorldCoords(coords_l.x, coords_l.y, coords_l.z);
        vehicle.setDamage(offset_l.x, offset_l.y, offset_l.z, 500, 10, true);
    }
    if (damage.deformations.taillightRight && !prevDamage.deformations.taillightRight) {
        let coords_r = vehicle.getWorldPositionOfBone(vehicle.getBoneIndexByName('taillight_r'));
        let offset_r = vehicle.getOffsetFromGivenWorldCoords(coords_r.x, coords_r.y, coords_r.z);
        vehicle.setDamage(offset_r.x, offset_r.y, offset_r.z, 500, 10, true);
    }
};
function isValidDoor(veh, door) {
    return mp.game.invoke("0x645F4B6E8499F632", veh.handle, door); // Native: _GET_IS_DOOR_VALID
}
const vehicleWindowName = {
    0: 'window_lf',
    1: 'window_rf',
    2: 'window_lr',
    3: 'window_rr',
    4: 'window_lm',
    5: 'window_rm',
    6: 'windscreen',
    7: 'windscreen_r'
};
function isWindowIntact(vehicle, window) {
    if (vehicle.getBoneIndexByName(vehicleWindowName[window]) === -1) {
        return true; // No such window, so it is intact
    }
    let isIntact = vehicle.isWindowIntact(window);
    let isUp = vehicle.isWindowUp(window + 1);
    if (isIntact)
        return true;
    if (!isUp) {
        vehicle.rollUpWindow(window);
        isIntact = vehicle.isWindowIntact(window);
        vehicle.rollDownWindow(window);
    }
    return isIntact;
}

}
vehicle_damage.js
{
/**
 * Fire properties:
 * Everything is by index, from 0 (small fire) to 2 (big fire).
 * The particle, life and time to create "child" fires is calculated from its index.
 * The bigger it is, the more life and the less time it takes to generate "children".
 * The children of the fires can be one greater or one less than their level.
 */
//
const FIRE_PARTICLES = [
    "fire_wrecked_train",
    "fire_wrecked_plane_cockpit",
    "ent_ray_meth_fires"
];
const FIRE_HEALTHS = [25, 75, 150];
const MAX_CHILD_VERTICAL_DISTANCE = 3;
let fires = [];
let lastFireHealth = 0;
let lastEventSend = 0;
let localCam;
/**
 * @param position
 * @param range - number
 * @returns {null|*} - Returns the near fire (in the range selected) of the given position, null if not exists fire in the area.
 */
function getNearFire(position, range) {
    for (let fire of fires) {
        if (mp.game.system.vdist(position.x, position.y, position.z, fire.pos.x, fire.pos.y, fire.pos.z) < range) {
            return fire;
        }
    }
    return null;
}
/**
 * @param id - particle id
 * @param particle - particle string
 * @param pos - vector3 to set position of fire
 * @returns {boolean} - true if can create the fire, else false
 */
mp.createFire = function (id, particle, pos) {
    if (!mp.isFire(particle))
        return false;
    let health = FIRE_HEALTHS[getFireParticleIndex(particle)];
    let newFire = {
        id: id,
        type: particle,
        health: health,
        pos: pos
    };
    fires.push(newFire);
    return true;
};
/**
 * @param particle - particle string
 * @returns {boolean} - True if the particle can be fire, else false
 */
mp.isFire = function (particle) {
    return FIRE_PARTICLES.includes(particle);
};
/**
 * @param fire - fire object
 * @returns {boolean} - True if the fire has been destroyed, else false.
 */
mp.destroyFire = function (fire, serverSide = false) {
    if (fire) {
        let indexFire = fires.indexOf(fire);
        fires.splice(indexFire, 1);
        if (serverSide)
            mp.events.callRemote("fire:destroy", fire.id);
        return true;
    }
    return false;
};
/**
 * @param fire - fire object
 * @param health - health to set
 * @returns {boolean} - returns true if the health has been changed, else false.
 */
function setFireHealth(fire, health) {
    if (fire) {
        fire.health = health;
        if (fire.health <= 0)
            mp.destroyFire(fire, true);
        else
            updateFireParticle(fire);
        return true;
    }
    return false;
}
function updateFireParticle(fire) {
    if (fire) {
        let lowerFireType = getFireParticleIndex(fire.type) - 1; // Get the fire before the current one
        if (lowerFireType > -1 && fire.health <= FIRE_HEALTHS[lowerFireType]) {
            if (Date.now() - lastEventSend < 1000)
                return;
            lastEventSend = Date.now();
            // If the life of the fire is less than that of its previous type, it means that its size must decrease.
            mp.events.callRemote("fire:change_type", fire.id, lowerFireType);
        }
        return true;
    }
    return false;
}
/**
 * @param particle - Particle string
 * @returns {number} - Returns the fire index of required particle string (if not exists returns -1)
 */
function getFireParticleIndex(particle) {
    return FIRE_PARTICLES.indexOf(particle);
}
/** Returns a random zone from the given, if cant get a new pos in 5 tries, return the initial pos */
mp.getSafeZ = function (pos) {
    let newZ;
    for (let x = 1; x <= 5; x++) {
        newZ = pos.z * x;
        let finalZ = mp.game.gameplay.getGroundZFor3dCoord(pos.x, pos.y, newZ, false, false);
        if (Math.abs(pos.z - finalZ) < MAX_CHILD_VERTICAL_DISTANCE) {
            pos.z = finalZ;
            break;
        }
    }
    return pos;
};
mp.getFireById = function (id) {
    return fires.find(it => it.id === id);
};
mp.events.add("render", () => {
    // check if is shooting "weapon_fireextinguisher"
    if (mp.players.local.weapon === 101631238 && mp.players.local.getConfigFlag(58, true)) {
        let forwardPos = mp.players.local.getForwardVector();
        let pos = mp.players.local.position;
        let nearPos = new mp.Vector3(pos.x + forwardPos.x, pos.y + forwardPos.y, pos.z + forwardPos.z);
        let fireNear = getNearFire(nearPos, 2);
        if (fireNear != null && Date.now() - lastFireHealth > 25) {
            setFireHealth(fireNear, fireNear.health - 0.2);
            lastFireHealth = Date.now();
        }
    }
    // check if the player is driving "firetruck"
    else if (mp.players.local.vehicle && mp.players.local.vehicle.model === 1938952078 && mp.players.local.vehicle.getPedInSeat(-1) === mp.players.local.handle) {
        let crosshairLong = 0.02;
        let crosshairShort = 0.002;
        mp.game.graphics.drawRect(0.5, 0.35, crosshairShort, crosshairLong * 1.2, 255, 255, 255, 200);
        mp.game.graphics.drawRect(0.5, 0.35, crosshairLong, crosshairShort * 1.2, 255, 255, 255, 200);
        if (mp.game.controls.isControlPressed(28, 70)) {
            if (!localCam) {
                let pos = mp.players.local.position;
                let camRot = mp.game.cam.getGameplayCamRot(2);
                localCam = mp.cameras.new('gameplay', pos, camRot, 40);
                let camPos = mp.game.graphics.screen2dToWorld3d(new mp.Vector3(600, 0, 0));
                let camDir = localCam.getDirection();
                const distance = 30;
                let farAway = new mp.Vector3((camDir.x * distance) + (camPos.x), (camDir.y * distance) + (camPos.y), ((camDir.z * distance) + (camPos.z)));
                let raycast = mp.raycasting.testPointToPoint(camPos, farAway, [mp.players.local.handle, mp.players.local.vehicle.handle], 1);
                if (raycast && raycast.position) {
                    let fireNear = getNearFire(raycast.position, 5);
                    if (fireNear != null) {
                        setFireHealth(fireNear, fireNear.health - 0.2);
                        lastFireHealth = Date.now();
                    }
                }
                localCam.destroy();
                localCam = null;
            }
        }
    }
    if (mp.players.local.duty) {
        let position = mp.players.local.position;
        for (let fire of fires) {
            //if (!mp.game.system.vdist(position.x, position.y, position.z, fire.pos.x, fire.pos.y, fire.pos.z) > 30) continue; // BUG!
            if (!(mp.game.system.vdist(position.x, position.y, position.z, fire.pos.x, fire.pos.y, fire.pos.z) > 30))
                continue;
            mp.game.graphics.drawText(`fire (type=${fire.type},hp=${fire.health})`, [fire.pos.x, fire.pos.y, fire.pos.z], {
                font: 0,
                color: [255, 255, 255, 190],
                scale: [0.35, 0.35],
                outline: true,
            });
        }
    }
});
let blurredEffect = false;
mp.setInterval(() => {
    // only check near fire when has almost one fire streamed
    if (fires.length > 0) {
        let fireNear = getNearFire(mp.players.local.position, 2);
        if (fireNear) {
            if (!blurredEffect)
                blurredEffect = mp.game.graphics.transitionToBlurred(600);
            mp.events.callRemote("health:on_take_fire_damage", 2);
        }
        else if (blurredEffect)
            blurredEffect = !mp.game.graphics.transitionFromBlurred(1000);
    }
}, 1000);

}
fire.js
{
System.register(["./_shared"], function (exports_1, context_1) {
    "use strict";
    var _shared_1, PROGRESSIVE, workQueue, draining, packetState, sniffRpcFilter, sniffRemotesFilter, RPC_LOG_WINDOW_MS, RPC_LOG_MAX_PER_WINDOW, rpcLogWindowStart, rpcLogCount, rpcLogDropped, originalCallRemote, pktQueue, queuedTask, binaryBuilder, MAX_UPLOAD_BATCH, eventHandlers, eventNames, bufferedBySeq, bufferedCount, expectedSequenceNumber, lastSyncedPacket, MessagePart, messageParts, __rr_requests;
    var __moduleName = context_1 && context_1.id;
    function joaatSigned(str) {
        return new Int32Array([mp.game.joaat(str)])[0];
    }
    function safeJSON(x) {
        try {
            return JSON.stringify(x);
        }
        catch {
            return String(x);
        }
    }
    function abbrev(str, max = 512) {
        try {
            return str.length > max ? str.slice(0, max) + `…(+${str.length - max}b)` : str;
        }
        catch {
            return String(str);
        }
    }
    function scheduleDrain() {
        if (draining)
            return;
        draining = true;
        setTimeout(drainWorkQueue, 0);
    }
    function drainWorkQueue() {
        const sliceDeadline = Date.now() + PROGRESSIVE.MAX_SLICE_MS;
        let packetsStarted = 0;
        let eventsBudget = PROGRESSIVE.MAX_EVENTS_PER_SLICE;
        let starved = false;
        while (workQueue.length > 0) {
            if (packetsStarted >= PROGRESSIVE.MAX_PACKETS_PER_SLICE)
                break;
            const pkt = workQueue[0];
            const timeLeft = Math.max(0, sliceDeadline - Date.now());
            if (timeLeft <= 0 || eventsBudget <= 0) {
                starved = true;
                break;
            }
            const res = processNetMessageIncremental(pkt, eventsBudget, timeLeft);
            eventsBudget -= res.consumedEvents;
            if (res.finished) {
                workQueue.shift();
                packetsStarted++;
            }
            if (res.hitDeadline || eventsBudget <= 0) {
                starved = true;
                break;
            }
        }
        draining = false;
        if (workQueue.length > 0) {
            // If starved, let the next tick continue draining.
            scheduleDrain();
        }
    }
    function shouldLogRpc(name) {
        if (sniffRpcFilter === null)
            return false;
        if (sniffRpcFilter.length < 2)
            return false; // ignore tiny/empty filters
        return !!name && name.indexOf(sniffRpcFilter) !== -1;
    }
    function shouldLogRemote(event) {
        if (!sniffRemotesFilter)
            return false;
        if (sniffRemotesFilter.length < 2)
            return false;
        return event.indexOf(sniffRemotesFilter) !== -1;
    }
    function rpcLog(text) {
        const now = Date.now();
        if (now - rpcLogWindowStart > RPC_LOG_WINDOW_MS) {
            if (rpcLogDropped > 0) {
                mp.console.logInfo(`[rpc logger] dropped ${rpcLogDropped} lines`, true, false);
            }
            rpcLogWindowStart = now;
            rpcLogCount = 0;
            rpcLogDropped = 0;
        }
        if (rpcLogCount >= RPC_LOG_MAX_PER_WINDOW) {
            rpcLogDropped++;
            return;
        }
        rpcLogCount++;
        // overlay only (true) and no file persist (false) to keep logging cheap
        mp.console.logInfo(text, true, false);
    }
    // ---------- incremental packet processing ----------
    function parseArgs(nparams, message) {
        const args = [];
        for (let i = 0; i < nparams; i++) {
            const type = message.readUByte();
            switch (type) {
                case 0:
                    args.push(message.readInt());
                    break;
                case 1:
                    args.push(message.readUTF8());
                    break;
                case 2:
                    args.push(new mp.Vector3(message.readFloat(), message.readFloat(), message.readFloat()));
                    break;
                case 3:
                    args.push(message.readFloat());
                    break;
                case 4:
                    args.push(message.readUByte() != 0);
                    break;
                case 5:
                    args.push(message.readUTF8());
                    break;
                case 6: {
                    const arrayLength = message.readInt();
                    const formatLength = message.readUByte();
                    const elements = [];
                    for (let j = 0; j < arrayLength; j++) {
                        const element = parseArgs(formatLength, message);
                        elements.push(element);
                    }
                    args.push(elements);
                    break;
                }
                default:
                    mp.game.graphics.notify("unexpected type: " + type + " at " + i);
            }
        }
        return args;
    }
    function processNetMessageIncremental(message, budgetEvents, budgetMs) {
        const deadline = Date.now() + (budgetMs || 0);
        let state = packetState.get(message);
        let consumed = 0;
        // read packet header once
        if (!state) {
            const sequence = message.readInt();
            const nmessages = message.readInt();
            state = { headerRead: true, sequence, remaining: nmessages };
            packetState.set(message, state);
        }
        // process RPCs under both time and count budgets
        while (state.remaining > 0) {
            if (budgetEvents-- <= 0)
                break;
            if (Date.now() >= deadline)
                break;
            // 1) RPC id
            const msgJoaat = message.readInt();
            const nparams = message.readUByte();
            // 2) Params
            const args = parseArgs(nparams, message);
            // 3) Dispatch + sniff
            try {
                const name = eventNames[msgJoaat];
                if (shouldLogRpc(name)) {
                    const body = abbrev(args.map(safeJSON).join(","), 1024);
                    rpcLog(`[rpc ${name}](${body})`);
                }
                mp.events.call(name || msgJoaat, ...args);
            }
            catch (e) {
                const ev = eventNames[msgJoaat] || msgJoaat;
                mp.console.logError("[net] error processing " + ev + ": " + (e.stack || e));
            }
            state.remaining--;
            consumed++;
        }
        const hitDeadline = Date.now() >= deadline;
        if (state.remaining <= 0) {
            packetState.delete(message);
            return { finished: true, consumedEvents: consumed, hitDeadline };
        }
        return { finished: false, consumedEvents: consumed, hitDeadline };
    }
    function pushPktsInQueue() {
        try {
            if (pktQueue.length > 0) {
                const count = Math.min(pktQueue.length, MAX_UPLOAD_BATCH);
                const toSend = pktQueue.splice(0, count);
                if (_shared_1.useBinary) {
                    // payload: [eventHash, base64(bytes)]
                    const payload = JSON.stringify(toSend.map(([evHash, evArgs]) => {
                        const bytes = binaryBuilder.reset().writeObj(evArgs).toBytes();
                        return [evHash, mp.bytesToBase64(bytes)];
                    }));
                    originalCallRemote("onJoebillRemoteBin", payload);
                }
                else {
                    // payload: [eventHash, args]
                    originalCallRemote("onJoebillRemote", JSON.stringify(toSend));
                }
                // if there are still items, keep flushing next tick
                if (pktQueue.length > 0) {
                    setTimeout(pushPktsInQueue, 0);
                    return;
                }
            }
        }
        finally {
            if (pktQueue.length === 0)
                queuedTask = false;
        }
    }
    // base64 (compressed) -> inflate -> BytesReader -> enqueue
    function onNetMessageFull(len, messageB64) {
        const begin = new Date().getTime();
        if (len != messageB64.length) {
            mp.console.logError(`~r~error: ~w~invalid decoded message ${messageB64.length} ${len}`);
            return;
        }
        const compressed = mp.base64ToBytes(messageB64);
        if (!compressed || compressed.length === 0)
            return;
        let decodedBytes;
        try {
            decodedBytes = pako.inflate(compressed);
        }
        catch (e) {
            mp.game.graphics.notify("~r~gzip inflate error: ~w~" + e);
            return;
        }
        const br = new _shared_1.BytesReader(decodedBytes);
        receiveNetMessage(br);
        const end = new Date().getTime();
        const prof = mp.profiler;
        if (prof) {
            prof.timeProcessingMessages = (prof.timeProcessingMessages || 0) + (end - begin);
        }
    }
    // in-order delivery + progressive enqueue
    function receiveNetMessage(netMessage) {
        const seq = netMessage.sequence_number;
        if (expectedSequenceNumber == 0 && bufferedCount == 0 && bufferedBySeq.size == 0) {
            expectedSequenceNumber = seq;
        }
        if (seq < expectedSequenceNumber) {
            mp.console.logError(`~r~error: ~w~old packet. we expected ${expectedSequenceNumber} and got ${seq}`);
            mp.events.call("warning:show", "lag", 7500);
            return;
        }
        if (seq > expectedSequenceNumber) {
            // buffer OOO packet
            if (!bufferedBySeq.has(seq)) {
                bufferedBySeq.set(seq, netMessage);
                bufferedCount++;
            }
            const now = new Date().getTime();
            // simple resync if too many buffered or too old
            if (bufferedCount > 32 || now - lastSyncedPacket > 20000) {
                // advance to the oldest buffered packet
                let oldestSeq = null;
                for (const k of bufferedBySeq.keys()) {
                    if (oldestSeq === null || k < oldestSeq)
                        oldestSeq = k;
                }
                if (oldestSeq !== null) {
                    const oldest = bufferedBySeq.get(oldestSeq);
                    bufferedBySeq.delete(oldestSeq);
                    bufferedCount--;
                    expectedSequenceNumber = oldestSeq;
                    receiveNetMessage(oldest);
                }
            }
            return;
        }
        // seq === expectedSequenceNumber
        workQueue.push(netMessage);
        expectedSequenceNumber++;
        lastSyncedPacket = new Date().getTime();
        // drain any consecutives already buffered
        while (true) {
            const next = bufferedBySeq.get(expectedSequenceNumber);
            if (!next)
                break;
            bufferedBySeq.delete(expectedSequenceNumber);
            bufferedCount--;
            workQueue.push(next);
            expectedSequenceNumber++;
            lastSyncedPacket = new Date().getTime();
        }
        scheduleDrain();
    }
    // classic (non-progressive) decoder — kept for local testing
    function processNetMessage(message) {
        const sequence = message.readInt();
        const nmessages = message.readInt();
        for (let k = 0; k < nmessages; k++) {
            const msgJoaat = message.readInt();
            const nparams = message.readUByte();
            const args = [];
            for (let i = 0; i < nparams; i++) {
                const type = message.readUByte();
                switch (type) {
                    case 0:
                        args.push(message.readInt());
                        break;
                    case 1:
                        args.push(message.readUTF8());
                        break;
                    case 2:
                        args.push(new mp.Vector3(message.readFloat(), message.readFloat(), message.readFloat()));
                        break;
                    case 3:
                        args.push(message.readFloat());
                        break;
                    case 4:
                        args.push(message.readUByte() != 0);
                        break;
                    case 5:
                        args.push(message.readUTF8());
                        break;
                    default:
                        mp.game.graphics.notify("unexpected type: " + type + " at " + i);
                }
            }
            try {
                const name = eventNames[msgJoaat];
                if (shouldLogRpc(name)) {
                    const body = abbrev(args.map(safeJSON).join(","), 1024);
                    rpcLog("[rpc " + name + "](" + body + ")");
                }
                mp.events.call(name || msgJoaat, ...args);
            }
            catch (e) {
                const eventName = eventNames[msgJoaat] || msgJoaat;
                const title = "error processing " +
                    eventName +
                    " with args " +
                    (() => { try {
                        return JSON.stringify(args).slice(0, 256);
                    }
                    catch {
                        return "<unserializable>";
                    } })();
                mp.events.call("chat:push", "~n~~r~" + title);
                mp.events.call("chat:push", "~y~" + (e.stack?.toString() || e).replace(/\n/g, "~n~"));
                mp.events.call("chat:show", true);
            }
        }
    }
    return {
        setters: [
            function (_shared_1_1) {
                _shared_1 = _shared_1_1;
            }
        ],
        execute: function () {
            // binds mp.base64ToBytes / mp.bytesToBase64
            require('base64.js');
            require('lib/pako.min.js');
            // ---------- incoming (server -> client): progressive draining config ----------
            PROGRESSIVE = {
                MAX_EVENTS_PER_SLICE: 64, // max RPCs to process per slice
                MAX_SLICE_MS: 8, // time budget (ms) per slice
                MAX_PACKETS_PER_SLICE: 1, // max packets started per slice
            };
            workQueue = [];
            draining = false;
            packetState = new WeakMap();
            // ---------- sniffers: filters + basic rate limit ----------
            sniffRpcFilter = null;
            sniffRemotesFilter = null;
            RPC_LOG_WINDOW_MS = 1000;
            RPC_LOG_MAX_PER_WINDOW = 200;
            rpcLogWindowStart = 0;
            rpcLogCount = 0;
            rpcLogDropped = 0;
            // ---------- outgoing (client -> server): queue + onJoebillRemote(/Bin) ----------
            originalCallRemote = mp.events.callRemote;
            mp.events.originalCallRemote = originalCallRemote;
            pktQueue = [];
            queuedTask = false;
            binaryBuilder = new _shared_1.BinaryBuilder();
            // cap per flush to avoid huge JSON blobs in one frame
            MAX_UPLOAD_BATCH = 64;
            mp.events.callRemote = (event, ...args) => {
                try {
                    if (shouldLogRemote(event)) {
                        const body = abbrev(args.map(safeJSON).join(","), 1024);
                        mp.console.logInfo(`[remote ${event}](${body})`, true, false);
                    }
                    const evHash = joaatSigned(event);
                    pktQueue.push([evHash, args]);
                    if (!queuedTask) {
                        queuedTask = true;
                        setTimeout(pushPktsInQueue, 0);
                    }
                }
                catch (e) {
                    // safety fallback if queueing fails for any reason
                    return originalCallRemote(event, ...args);
                }
            };
            // ---------- decoding registry + receive pipeline ----------
            eventHandlers = {};
            eventNames = {};
            mp.rpc = function (event, handler) {
                const h = joaatSigned(event);
                eventHandlers[h] = handler;
                eventNames[h] = event;
                mp.events.add(event, handler);
            };
            // out-of-order buffer (Map-based for O(1) lookup of next expected)
            bufferedBySeq = new Map();
            bufferedCount = 0;
            expectedSequenceNumber = 0;
            lastSyncedPacket = new Date().getTime();
            // ---------- chunked reassembly (stricter validation) ----------
            MessagePart = class MessagePart {
                constructor(id, totalLen, totalChunks) {
                    this.id = id;
                    this.totalLen = totalLen;
                    this.totalChunks = totalChunks;
                    this.readChunks = 0;
                    this.chunks = new Array(totalChunks);
                }
            };
            messageParts = {};
            mp.events.add("on_net_message", onNetMessageFull);
            mp.events.add("on_net_message_part", (packetId, chunkId, totalChunks, totalLen, chunkLen, chunkStr) => {
                let part = messageParts[packetId];
                if (part == null) {
                    messageParts[packetId] = part = new MessagePart(packetId, totalLen, totalChunks);
                }
                // reject malformed chunk
                if (chunkLen !== chunkStr.length) {
                    mp.console.logError(`chunkLen(${chunkLen}) != chunkStr.length(${chunkStr.length})`);
                    return;
                }
                if (part.chunks[chunkId] == null) {
                    part.chunks[chunkId] = chunkStr;
                    part.readChunks++;
                }
                if (part.readChunks == part.totalChunks) {
                    const data = part.chunks.join("");
                    delete messageParts[packetId];
                    if (data.length != part.totalLen) {
                        mp.console.logError(`~r~error: ~w~reassembled len ${data.length} != expected ${part.totalLen}`);
                        return;
                    }
                    onNetMessageFull(data.length, data);
                }
            });
            // ---------- sniffers (debug) ----------
            mp.rpc("protocol:sniff_remotes", (filter) => { sniffRemotesFilter = filter; });
            mp.rpc("protocol:dont_sniff_remotes", () => { sniffRemotesFilter = null; });
            mp.rpc("protocol:sniff_rpc", (filter) => { sniffRpcFilter = filter; });
            mp.rpc("protocol:dont_sniff_rpc", () => { sniffRpcFilter = null; });
            __rr_requests = new Map();
            mp.requestRemote = (name, ...args) => {
                return new Promise((resolve, reject) => {
                    const id = Math.random().toString(36).substring(2, 10);
                    const timeout = setTimeout(() => {
                        __rr_requests.delete(id);
                        const timeoutMessage = `[ERROR] [requestRemote] timed out, id=${id}, name=${name}`;
                        mp.console.logWarning(timeoutMessage, true, true);
                        reject(new Error(timeoutMessage));
                    }, 5000);
                    __rr_requests.set(id, { resolve, reject, timeout });
                    mp.events.callRemote(name, id, ...args); // flows through our aggregator
                });
            };
            mp.rpc("%request:response", (id, success, response) => {
                const result = __rr_requests.get(id);
                __rr_requests.delete(id);
                if (!result)
                    return;
                clearTimeout(result.timeout);
                try {
                    if (success)
                        result.resolve(JSON.parse(response));
                    else
                        result.reject(new Error(response));
                }
                catch (e) {
                    result.reject(e);
                }
            });
            mp.rpc("player:set_max_events_per_slice", (amount) => {
                PROGRESSIVE.MAX_EVENTS_PER_SLICE = amount;
            });
            mp.rpc("player:set_max_slice_ms", (amount) => {
                PROGRESSIVE.MAX_SLICE_MS = amount;
            });
            mp.rpc("player:set_max_packets_per_slice", (amount) => {
                PROGRESSIVE.MAX_PACKETS_PER_SLICE = amount;
            });
        }
    };
});

}
net_protocol.js
{
System.register([], function (exports_1, context_1) {
    "use strict";
    var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    };
    var _BinaryBuilder_data, _BinaryBuilder_pos, sharedVersion, shared, useBinary, V3, TextDecoderPoly, TextEncoderPoly, BytesReader, TextDecoder, TextEncoder, BinaryBuilder;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            exports_1("sharedVersion", sharedVersion = 20250124005);
            exports_1("shared", shared = sharedVersion);
            exports_1("useBinary", useBinary = true);
            V3 = (typeof Vector3 !== 'undefined') ? Vector3 : mp.Vector3;
            TextDecoderPoly = class TextDecoderPoly {
                constructor(encoding = 'utf-8') {
                    this.encoding = encoding;
                }
                decode(array) {
                    var out, i, len, c;
                    var char2, char3;
                    out = "";
                    len = array.length;
                    i = 0;
                    while (i < len) {
                        c = array[i++];
                        switch (c >> 4) {
                            case 0:
                            case 1:
                            case 2:
                            case 3:
                            case 4:
                            case 5:
                            case 6:
                            case 7:
                                // 0xxxxxxx
                                out += String.fromCharCode(c);
                                break;
                            case 12:
                            case 13:
                                // 110x xxxx   10xx xxxx
                                char2 = array[i++];
                                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                                break;
                            case 14:
                                // 1110 xxxx  10xx xxxx  10xx xxxx
                                char2 = array[i++];
                                char3 = array[i++];
                                out += String.fromCharCode(((c & 0x0F) << 12) |
                                    ((char2 & 0x3F) << 6) |
                                    ((char3 & 0x3F) << 0));
                                break;
                        }
                    }
                    return out;
                }
            };
            exports_1("TextDecoderPoly", TextDecoderPoly);
            TextEncoderPoly = class TextEncoderPoly {
                constructor(encoding = 'utf-8') {
                    this.encoding = encoding;
                }
                encode(string) {
                    var pos = 0;
                    var len = string.length;
                    var at = 0; // output position
                    var tlen = Math.max(32, len + (len >>> 1) + 7); // 1.5x size
                    var target = new Uint8Array((tlen >>> 3) << 3); // ... but at 8 byte offset
                    while (pos < len) {
                        var value = string.charCodeAt(pos++);
                        if (value >= 0xd800 && value <= 0xdbff) {
                            // high surrogate
                            if (pos < len) {
                                var extra = string.charCodeAt(pos);
                                if ((extra & 0xfc00) === 0xdc00) {
                                    ++pos;
                                    value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                                }
                            }
                            if (value >= 0xd800 && value <= 0xdbff) {
                                continue; // drop lone surrogate
                            }
                        }
                        // expand the buffer if we couldn't write 4 bytes
                        if (at + 4 > target.length) {
                            tlen += 8; // minimum extra
                            tlen *= (1.0 + (pos / string.length) * 2); // take 2x the remaining
                            tlen = (tlen >>> 3) << 3; // 8 byte offset
                            var update = new Uint8Array(tlen);
                            update.set(target);
                            target = update;
                        }
                        if ((value & 0xffffff80) === 0) { // 1-byte
                            target[at++] = value; // ASCII
                            continue;
                        }
                        else if ((value & 0xfffff800) === 0) { // 2-byte
                            target[at++] = ((value >>> 6) & 0x1f) | 0xc0;
                        }
                        else if ((value & 0xffff0000) === 0) { // 3-byte
                            target[at++] = ((value >>> 12) & 0x0f) | 0xe0;
                            target[at++] = ((value >>> 6) & 0x3f) | 0x80;
                        }
                        else if ((value & 0xffe00000) === 0) { // 4-byte
                            target[at++] = ((value >>> 18) & 0x07) | 0xf0;
                            target[at++] = ((value >>> 12) & 0x3f) | 0x80;
                            target[at++] = ((value >>> 6) & 0x3f) | 0x80;
                        }
                        else {
                            continue; // out of range
                        }
                        target[at++] = (value & 0x3f) | 0x80;
                    }
                    // Use subarray if slice isn't supported (IE11). This will use more memory
                    // because the original array still exists.
                    return target.slice ? target.slice(0, at) : target.subarray(0, at);
                }
            };
            exports_1("TextEncoderPoly", TextEncoderPoly);
            BytesReader = class BytesReader {
                constructor(data) {
                    this.data = new DataView(data.buffer || data);
                    this.pos = 0;
                }
                get available() {
                    return this.data.byteLength - this.pos;
                }
                skip(count) {
                    const oldpos = this.pos;
                    this.pos += count;
                    return oldpos;
                }
                get sequence_number() {
                    return this.data.getInt32(0);
                }
                readByte() { return this.data.getInt8(this.skip(1)); }
                readUByte() { return this.data.getUint8(this.skip(1)); }
                readShort() { return this.data.getInt16(this.skip(2), false); }
                readUShort() { return this.data.getUint16(this.skip(2), false); }
                readInt() { return this.data.getInt32(this.skip(4), false); }
                readFloat() { return this.data.getFloat32(this.skip(4), false); }
                readBytes(count) { return new Uint8Array(this.data.buffer, this.skip(count), count); }
                readUTF8() {
                    return new TextDecoder('utf-8').decode(this.readBytes(this.readInt()));
                    //return Utf8ArrayToStr(this.readBytes(this.readInt()));
                }
            };
            exports_1("BytesReader", BytesReader);
            exports_1("TextDecoder", TextDecoder = globalThis.TextDecoder ? globalThis.TextDecoder : TextDecoderPoly);
            exports_1("TextEncoder", TextEncoder = globalThis.TextEncoder ? globalThis.TextEncoder : TextEncoderPoly);
            // @TODO: Maybe we can do this in the client_packages and serialize as base64, and then re-send it to Kotlin, to reduce objects here
            BinaryBuilder = class BinaryBuilder {
                constructor() {
                    _BinaryBuilder_data.set(this, new DataView(new ArrayBuffer(512 * 1024)));
                    _BinaryBuilder_pos.set(this, 0);
                }
                static rotateLeft32(num, bits) {
                    return (num << bits) | (num >>> (32 - bits));
                }
                skip(count) {
                    const oldPos = __classPrivateFieldGet(this, _BinaryBuilder_pos, "f");
                    __classPrivateFieldSet(this, _BinaryBuilder_pos, __classPrivateFieldGet(this, _BinaryBuilder_pos, "f") + count, "f");
                    return oldPos;
                }
                ensure(count) {
                    if (__classPrivateFieldGet(this, _BinaryBuilder_pos, "f") + count >= __classPrivateFieldGet(this, _BinaryBuilder_data, "f").byteLength) {
                        const newSize = ((__classPrivateFieldGet(this, _BinaryBuilder_data, "f").byteLength + 7) * 2);
                        const old = __classPrivateFieldGet(this, _BinaryBuilder_data, "f").buffer;
                        const oldSize = old.byteLength;
                        if (newSize >= 4 * 1042 * 1024) {
                            throw new Error(`Buffer overflow. Trying to grow the buffer too much ${oldSize} -> ${newSize}`);
                        }
                        __classPrivateFieldSet(this, _BinaryBuilder_data, new DataView(new ArrayBuffer(newSize)), "f");
                        new Uint8Array(__classPrivateFieldGet(this, _BinaryBuilder_data, "f").buffer).set(new Uint8Array(old), 0);
                        console.log('Growing DataView buffer from ', old.byteLength, 'to', __classPrivateFieldGet(this, _BinaryBuilder_data, "f").buffer.byteLength, 'pos=', __classPrivateFieldGet(this, _BinaryBuilder_pos, "f"), 'count=', count);
                    }
                    return __classPrivateFieldGet(this, _BinaryBuilder_data, "f");
                }
                writeS8(value) { this.ensure(1).setInt8(this.skip(1), value); }
                writeS16LE(value) { this.ensure(2).setInt16(this.skip(2), value, true); }
                writeS32LE(value) { this.ensure(4).setInt32(this.skip(4), value, true); }
                writeF32LE(value) { this.ensure(4).setFloat32(this.skip(4), value, true); }
                writeF64LE(value) { this.ensure(8).setFloat64(this.skip(8), value, true); }
                writeUVL(value) {
                    //if (value < 0) throw new Error("value must be positive")
                    do {
                        const c = value & 0x7F;
                        value >>>= 7;
                        this.writeS8(c | ((value != 0) ? 0x80 : 0));
                        //console.log('write', value)
                    } while (value != 0);
                }
                writeSVL(value) {
                    // Sign is bit 31
                    this.writeUVL(BinaryBuilder.rotateLeft32(value, 1));
                }
                writeBytes(bytes) {
                    new Uint8Array(this.ensure(bytes.length).buffer).set(bytes, this.skip(bytes.length));
                }
                writeVLBytes(bytes) {
                    this.writeUVL(bytes.byteLength);
                    this.writeBytes(bytes);
                }
                writeVLString(str) {
                    this.writeVLBytes(new TextEncoder().encode(str));
                }
                writeObj(value) {
                    try {
                        return this._writeObj(value);
                    }
                    catch (e) {
                        console.error('Error trying to serialize', value, e);
                        return null;
                    }
                }
                // @TODO: Maybe we can do this in the client_packages and serialize as base64, and then re-send it to Kotlin, to reduce objects here
                _writeObj(value, depth = 0) {
                    if (depth >= 10) {
                        console.error("DEPTH TOO HIGH!", depth, typeof value, value);
                    }
                    if (value === undefined) {
                        this.writeS8(BinaryBuilder.TYPE_UNDEFINED);
                    }
                    else if (value === null) {
                        this.writeS8(BinaryBuilder.TYPE_NULL);
                    }
                    else if (typeof value === 'boolean') {
                        this.writeS8(value ? BinaryBuilder.TYPE_TRUE : BinaryBuilder.TYPE_FALSE);
                    }
                    else if (typeof value === 'number') {
                        if (value == (value | 0)) {
                            if (value >= 0) {
                                this.writeS8(BinaryBuilder.TYPE_UINT);
                                this.writeUVL(value);
                            }
                            else {
                                this.writeS8(BinaryBuilder.TYPE_INT);
                                this.writeSVL(value);
                            }
                        }
                        else {
                            this.writeS8(BinaryBuilder.TYPE_DOUBLE);
                            this.writeF64LE(value);
                        }
                    }
                    else if (typeof value === 'string') {
                        this.writeS8(BinaryBuilder.TYPE_STR);
                        this.writeVLString(value);
                    }
                    else if (value instanceof Array) {
                        var allInt = true;
                        var allDouble = true;
                        for (const v of value) {
                            if (typeof v === 'number') {
                                if (v != (v | 0)) {
                                    allInt = false;
                                }
                            }
                            else {
                                allInt = false;
                                allDouble = false;
                                break;
                            }
                        }
                        if (allInt) {
                            this.writeS8(BinaryBuilder.TYPE_ARRAY_INT);
                            this.writeUVL(value.length);
                            for (const v of value)
                                this.writeSVL(v);
                        }
                        else if (allDouble) {
                            this.writeS8(BinaryBuilder.TYPE_ARRAY_DOUBLE);
                            this.writeUVL(value.length);
                            for (const v of value)
                                this.writeF64LE(v);
                        }
                        else {
                            this.writeS8(BinaryBuilder.TYPE_ARRAY);
                            this.writeUVL(value.length);
                            for (const v of value)
                                this._writeObj(v, depth + 1);
                        }
                    }
                    else if (value instanceof Uint8Array) {
                        if (value.isRaw) {
                            this.writeBytes(value);
                        }
                        else {
                            this.writeS8(BinaryBuilder.TYPE_BYTES);
                            this.writeVLBytes(value);
                        }
                        for (const v of value)
                            this.writeSVL(v);
                    }
                    else if (value instanceof V3) {
                        this.writeS8(BinaryBuilder.TYPE_VECTOR);
                        this.writeF32LE(value.x);
                        this.writeF32LE(value.y);
                        this.writeF32LE(value.z);
                    }
                    else {
                        const entries = Object.entries(value);
                        // We have a vector
                        if (entries.length === 3 && typeof value.x == 'number' && typeof value.y == 'number' && typeof value.z == 'number') {
                            this.writeS8(BinaryBuilder.TYPE_VECTOR);
                            this.writeF32LE(value.x);
                            this.writeF32LE(value.y);
                            this.writeF32LE(value.z);
                        }
                        else {
                            this.writeS8(BinaryBuilder.TYPE_OBJECT);
                            this.writeUVL(entries.length);
                            for (let [k, v] of entries) {
                                this.writeVLString(k);
                                this._writeObj(v, depth + 1);
                            }
                        }
                    }
                    return this;
                }
                toBytes() {
                    return new Uint8Array(__classPrivateFieldGet(this, _BinaryBuilder_data, "f").buffer).slice(0, __classPrivateFieldGet(this, _BinaryBuilder_pos, "f"));
                }
                getPos() {
                    return __classPrivateFieldGet(this, _BinaryBuilder_pos, "f");
                }
                reset() {
                    __classPrivateFieldSet(this, _BinaryBuilder_pos, 0, "f");
                    return this;
                }
            };
            exports_1("BinaryBuilder", BinaryBuilder);
            _BinaryBuilder_data = new WeakMap(), _BinaryBuilder_pos = new WeakMap();
            BinaryBuilder.TYPE_FALSE = 0xA0;
            BinaryBuilder.TYPE_TRUE = 0xA1;
            BinaryBuilder.TYPE_NULL = 0xB0;
            BinaryBuilder.TYPE_UNDEFINED = 0xB1;
            BinaryBuilder.TYPE_INT = 0xC0;
            BinaryBuilder.TYPE_UINT = 0xC1;
            BinaryBuilder.TYPE_DOUBLE = 0xC2;
            BinaryBuilder.TYPE_STR = 0xD0;
            BinaryBuilder.TYPE_ARRAY = 0xE0;
            BinaryBuilder.TYPE_ARRAY_INT = 0xE1;
            BinaryBuilder.TYPE_ARRAY_DOUBLE = 0xE2;
            BinaryBuilder.TYPE_OBJECT = 0xF0;
            BinaryBuilder.TYPE_VECTOR = 0xF1;
            BinaryBuilder.TYPE_BYTES = 0xFF;
        }
    };
});

}
_shared
{
/// <reference path="../node_modules/@ragempcommunity/types-client/index.d.ts" />
/*
MIT License
Copyright (c) 2020 Egor Nepomnyaschih
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/*
// This constant can also be computed with the following algorithm:
const base64abc = [],
    A = "A".charCodeAt(0),
    a = "a".charCodeAt(0),
    n = "0".charCodeAt(0);
for (let i = 0; i < 26; ++i) {
    base64abc.push(String.fromCharCode(A + i));
}
for (let i = 0; i < 26; ++i) {
    base64abc.push(String.fromCharCode(a + i));
}
for (let i = 0; i < 10; ++i) {
    base64abc.push(String.fromCharCode(n + i));
}
base64abc.push("+");
base64abc.push("/");
*/
const base64abc = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"
];
/*
// This constant can also be computed with the following algorithm:
const l = 256, base64codes = new Uint8Array(l);
for (let i = 0; i < l; ++i) {
    base64codes[i] = 255; // invalid character
}
base64abc.forEach((char, index) => {
    base64codes[char.charCodeAt(0)] = index;
});
base64codes["=".charCodeAt(0)] = 0; // ignored anyway, so we just need to prevent an error
*/
const base64codes = [
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255,
    255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255,
    255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
];
function getBase64Code(charCode) {
    if (charCode >= base64codes.length) {
        throw new Error("Unable to parse base64 string.");
    }
    const code = base64codes[charCode];
    if (code === 255) {
        throw new Error("Unable to parse base64 string.");
    }
    return code;
}
function bytesToBase64(bytes) {
    let result = '', i, l = bytes.length;
    for (i = 2; i < l; i += 3) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
        result += base64abc[bytes[i] & 0x3F];
    }
    if (i === l + 1) { // 1 octet yet to write
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[(bytes[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) { // 2 octets yet to write
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[(bytes[i - 1] & 0x0F) << 2];
        result += "=";
    }
    return result;
}
mp.bytesToBase64 = bytesToBase64;
mp.base64ToBytes = function (str) {
    if (str.length % 4 !== 0) {
        throw new Error("Unable to parse base64 string.");
    }
    const index = str.indexOf("=");
    if (index !== -1 && index < str.length - 2) {
        throw new Error("Unable to parse base64 string.");
    }
    let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0, n = str.length, result = new Uint8Array(3 * (n / 4)), buffer;
    for (let i = 0, j = 0; i < n; i += 4, j += 3) {
        buffer =
            getBase64Code(str.charCodeAt(i)) << 18 |
                getBase64Code(str.charCodeAt(i + 1)) << 12 |
                getBase64Code(str.charCodeAt(i + 2)) << 6 |
                getBase64Code(str.charCodeAt(i + 3));
        result[j] = buffer >> 16;
        result[j + 1] = (buffer >> 8) & 0xFF;
        result[j + 2] = buffer & 0xFF;
    }
    return result.subarray(0, result.length - missingOctets);
};
function base64encode(str, encoder = new TextEncoder()) {
    return bytesToBase64(encoder.encode(str));
}
function base64decode(str, decoder = new TextDecoder()) {
    return decoder.decode(mp.base64ToBytes(str));
}

}
base64.js
{
!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).pako=t()}}(function(){return function r(s,o,l){function h(e,t){if(!o[e]){if(!s[e]){var a="function"==typeof require&&require;if(!t&&a)return a(e,!0);if(d)return d(e,!0);var i=new Error("Cannot find module '"+e+"'");throw i.code="MODULE_NOT_FOUND",i}var n=o[e]={exports:{}};s[e][0].call(n.exports,function(t){return h(s[e][1][t]||t)},n,n.exports,r,s,o,l)}return o[e].exports}for(var d="function"==typeof require&&require,t=0;t<l.length;t++)h(l[t]);return h}({1:[function(t,e,a){"use strict";var s=t("./zlib/deflate"),o=t("./utils/common"),l=t("./utils/strings"),n=t("./zlib/messages"),r=t("./zlib/zstream"),h=Object.prototype.toString,d=0,f=-1,_=0,u=8;function c(t){if(!(this instanceof c))return new c(t);this.options=o.assign({level:f,method:u,chunkSize:16384,windowBits:15,memLevel:8,strategy:_,to:""},t||{});var e=this.options;e.raw&&0<e.windowBits?e.windowBits=-e.windowBits:e.gzip&&0<e.windowBits&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new r,this.strm.avail_out=0;var a=s.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(a!==d)throw new Error(n[a]);if(e.header&&s.deflateSetHeader(this.strm,e.header),e.dictionary){var i;if(i="string"==typeof e.dictionary?l.string2buf(e.dictionary):"[object ArrayBuffer]"===h.call(e.dictionary)?new Uint8Array(e.dictionary):e.dictionary,(a=s.deflateSetDictionary(this.strm,i))!==d)throw new Error(n[a]);this._dict_set=!0}}function i(t,e){var a=new c(e);if(a.push(t,!0),a.err)throw a.msg||n[a.err];return a.result}c.prototype.push=function(t,e){var a,i,n=this.strm,r=this.options.chunkSize;if(this.ended)return!1;i=e===~~e?e:!0===e?4:0,"string"==typeof t?n.input=l.string2buf(t):"[object ArrayBuffer]"===h.call(t)?n.input=new Uint8Array(t):n.input=t,n.next_in=0,n.avail_in=n.input.length;do{if(0===n.avail_out&&(n.output=new o.Buf8(r),n.next_out=0,n.avail_out=r),1!==(a=s.deflate(n,i))&&a!==d)return this.onEnd(a),!(this.ended=!0);0!==n.avail_out&&(0!==n.avail_in||4!==i&&2!==i)||("string"===this.options.to?this.onData(l.buf2binstring(o.shrinkBuf(n.output,n.next_out))):this.onData(o.shrinkBuf(n.output,n.next_out)))}while((0<n.avail_in||0===n.avail_out)&&1!==a);return 4===i?(a=s.deflateEnd(this.strm),this.onEnd(a),this.ended=!0,a===d):2!==i||(this.onEnd(d),!(n.avail_out=0))},c.prototype.onData=function(t){this.chunks.push(t)},c.prototype.onEnd=function(t){t===d&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg},a.Deflate=c,a.deflate=i,a.deflateRaw=function(t,e){return(e=e||{}).raw=!0,i(t,e)},a.gzip=function(t,e){return(e=e||{}).gzip=!0,i(t,e)}},{"./utils/common":3,"./utils/strings":4,"./zlib/deflate":8,"./zlib/messages":13,"./zlib/zstream":15}],2:[function(t,e,a){"use strict";var f=t("./zlib/inflate"),_=t("./utils/common"),u=t("./utils/strings"),c=t("./zlib/constants"),i=t("./zlib/messages"),n=t("./zlib/zstream"),r=t("./zlib/gzheader"),b=Object.prototype.toString;function s(t){if(!(this instanceof s))return new s(t);this.options=_.assign({chunkSize:16384,windowBits:0,to:""},t||{});var e=this.options;e.raw&&0<=e.windowBits&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(0<=e.windowBits&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),15<e.windowBits&&e.windowBits<48&&0==(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new n,this.strm.avail_out=0;var a=f.inflateInit2(this.strm,e.windowBits);if(a!==c.Z_OK)throw new Error(i[a]);if(this.header=new r,f.inflateGetHeader(this.strm,this.header),e.dictionary&&("string"==typeof e.dictionary?e.dictionary=u.string2buf(e.dictionary):"[object ArrayBuffer]"===b.call(e.dictionary)&&(e.dictionary=new Uint8Array(e.dictionary)),e.raw&&(a=f.inflateSetDictionary(this.strm,e.dictionary))!==c.Z_OK))throw new Error(i[a])}function o(t,e){var a=new s(e);if(a.push(t,!0),a.err)throw a.msg||i[a.err];return a.result}s.prototype.push=function(t,e){var a,i,n,r,s,o=this.strm,l=this.options.chunkSize,h=this.options.dictionary,d=!1;if(this.ended)return!1;i=e===~~e?e:!0===e?c.Z_FINISH:c.Z_NO_FLUSH,"string"==typeof t?o.input=u.binstring2buf(t):"[object ArrayBuffer]"===b.call(t)?o.input=new Uint8Array(t):o.input=t,o.next_in=0,o.avail_in=o.input.length;do{if(0===o.avail_out&&(o.output=new _.Buf8(l),o.next_out=0,o.avail_out=l),(a=f.inflate(o,c.Z_NO_FLUSH))===c.Z_NEED_DICT&&h&&(a=f.inflateSetDictionary(this.strm,h)),a===c.Z_BUF_ERROR&&!0===d&&(a=c.Z_OK,d=!1),a!==c.Z_STREAM_END&&a!==c.Z_OK)return this.onEnd(a),!(this.ended=!0);o.next_out&&(0!==o.avail_out&&a!==c.Z_STREAM_END&&(0!==o.avail_in||i!==c.Z_FINISH&&i!==c.Z_SYNC_FLUSH)||("string"===this.options.to?(n=u.utf8border(o.output,o.next_out),r=o.next_out-n,s=u.buf2string(o.output,n),o.next_out=r,o.avail_out=l-r,r&&_.arraySet(o.output,o.output,n,r,0),this.onData(s)):this.onData(_.shrinkBuf(o.output,o.next_out)))),0===o.avail_in&&0===o.avail_out&&(d=!0)}while((0<o.avail_in||0===o.avail_out)&&a!==c.Z_STREAM_END);return a===c.Z_STREAM_END&&(i=c.Z_FINISH),i===c.Z_FINISH?(a=f.inflateEnd(this.strm),this.onEnd(a),this.ended=!0,a===c.Z_OK):i!==c.Z_SYNC_FLUSH||(this.onEnd(c.Z_OK),!(o.avail_out=0))},s.prototype.onData=function(t){this.chunks.push(t)},s.prototype.onEnd=function(t){t===c.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=_.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg},a.Inflate=s,a.inflate=o,a.inflateRaw=function(t,e){return(e=e||{}).raw=!0,o(t,e)},a.ungzip=o},{"./utils/common":3,"./utils/strings":4,"./zlib/constants":6,"./zlib/gzheader":9,"./zlib/inflate":11,"./zlib/messages":13,"./zlib/zstream":15}],3:[function(t,e,a){"use strict";var i="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;a.assign=function(t){for(var e,a,i=Array.prototype.slice.call(arguments,1);i.length;){var n=i.shift();if(n){if("object"!=typeof n)throw new TypeError(n+"must be non-object");for(var r in n)e=n,a=r,Object.prototype.hasOwnProperty.call(e,a)&&(t[r]=n[r])}}return t},a.shrinkBuf=function(t,e){return t.length===e?t:t.subarray?t.subarray(0,e):(t.length=e,t)};var n={arraySet:function(t,e,a,i,n){if(e.subarray&&t.subarray)t.set(e.subarray(a,a+i),n);else for(var r=0;r<i;r++)t[n+r]=e[a+r]},flattenChunks:function(t){var e,a,i,n,r,s;for(e=i=0,a=t.length;e<a;e++)i+=t[e].length;for(s=new Uint8Array(i),e=n=0,a=t.length;e<a;e++)r=t[e],s.set(r,n),n+=r.length;return s}},r={arraySet:function(t,e,a,i,n){for(var r=0;r<i;r++)t[n+r]=e[a+r]},flattenChunks:function(t){return[].concat.apply([],t)}};a.setTyped=function(t){t?(a.Buf8=Uint8Array,a.Buf16=Uint16Array,a.Buf32=Int32Array,a.assign(a,n)):(a.Buf8=Array,a.Buf16=Array,a.Buf32=Array,a.assign(a,r))},a.setTyped(i)},{}],4:[function(t,e,a){"use strict";var l=t("./common"),n=!0,r=!0;try{String.fromCharCode.apply(null,[0])}catch(t){n=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(t){r=!1}for(var h=new l.Buf8(256),i=0;i<256;i++)h[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;function d(t,e){if(e<65534&&(t.subarray&&r||!t.subarray&&n))return String.fromCharCode.apply(null,l.shrinkBuf(t,e));for(var a="",i=0;i<e;i++)a+=String.fromCharCode(t[i]);return a}h[254]=h[254]=1,a.string2buf=function(t){var e,a,i,n,r,s=t.length,o=0;for(n=0;n<s;n++)55296==(64512&(a=t.charCodeAt(n)))&&n+1<s&&56320==(64512&(i=t.charCodeAt(n+1)))&&(a=65536+(a-55296<<10)+(i-56320),n++),o+=a<128?1:a<2048?2:a<65536?3:4;for(e=new l.Buf8(o),n=r=0;r<o;n++)55296==(64512&(a=t.charCodeAt(n)))&&n+1<s&&56320==(64512&(i=t.charCodeAt(n+1)))&&(a=65536+(a-55296<<10)+(i-56320),n++),a<128?e[r++]=a:(a<2048?e[r++]=192|a>>>6:(a<65536?e[r++]=224|a>>>12:(e[r++]=240|a>>>18,e[r++]=128|a>>>12&63),e[r++]=128|a>>>6&63),e[r++]=128|63&a);return e},a.buf2binstring=function(t){return d(t,t.length)},a.binstring2buf=function(t){for(var e=new l.Buf8(t.length),a=0,i=e.length;a<i;a++)e[a]=t.charCodeAt(a);return e},a.buf2string=function(t,e){var a,i,n,r,s=e||t.length,o=new Array(2*s);for(a=i=0;a<s;)if((n=t[a++])<128)o[i++]=n;else if(4<(r=h[n]))o[i++]=65533,a+=r-1;else{for(n&=2===r?31:3===r?15:7;1<r&&a<s;)n=n<<6|63&t[a++],r--;1<r?o[i++]=65533:n<65536?o[i++]=n:(n-=65536,o[i++]=55296|n>>10&1023,o[i++]=56320|1023&n)}return d(o,i)},a.utf8border=function(t,e){var a;for((e=e||t.length)>t.length&&(e=t.length),a=e-1;0<=a&&128==(192&t[a]);)a--;return a<0?e:0===a?e:a+h[t[a]]>e?a:e}},{"./common":3}],5:[function(t,e,a){"use strict";e.exports=function(t,e,a,i){for(var n=65535&t|0,r=t>>>16&65535|0,s=0;0!==a;){for(a-=s=2e3<a?2e3:a;r=r+(n=n+e[i++]|0)|0,--s;);n%=65521,r%=65521}return n|r<<16|0}},{}],6:[function(t,e,a){"use strict";e.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],7:[function(t,e,a){"use strict";var o=function(){for(var t,e=[],a=0;a<256;a++){t=a;for(var i=0;i<8;i++)t=1&t?3988292384^t>>>1:t>>>1;e[a]=t}return e}();e.exports=function(t,e,a,i){var n=o,r=i+a;t^=-1;for(var s=i;s<r;s++)t=t>>>8^n[255&(t^e[s])];return-1^t}},{}],8:[function(t,e,a){"use strict";var l,_=t("../utils/common"),h=t("./trees"),u=t("./adler32"),c=t("./crc32"),i=t("./messages"),d=0,f=4,b=0,g=-2,m=-1,w=4,n=2,p=8,v=9,r=286,s=30,o=19,k=2*r+1,y=15,x=3,z=258,B=z+x+1,S=42,E=113,A=1,Z=2,R=3,C=4;function N(t,e){return t.msg=i[e],e}function O(t){return(t<<1)-(4<t?9:0)}function D(t){for(var e=t.length;0<=--e;)t[e]=0}function I(t){var e=t.state,a=e.pending;a>t.avail_out&&(a=t.avail_out),0!==a&&(_.arraySet(t.output,e.pending_buf,e.pending_out,a,t.next_out),t.next_out+=a,e.pending_out+=a,t.total_out+=a,t.avail_out-=a,e.pending-=a,0===e.pending&&(e.pending_out=0))}function U(t,e){h._tr_flush_block(t,0<=t.block_start?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,I(t.strm)}function T(t,e){t.pending_buf[t.pending++]=e}function F(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e}function L(t,e){var a,i,n=t.max_chain_length,r=t.strstart,s=t.prev_length,o=t.nice_match,l=t.strstart>t.w_size-B?t.strstart-(t.w_size-B):0,h=t.window,d=t.w_mask,f=t.prev,_=t.strstart+z,u=h[r+s-1],c=h[r+s];t.prev_length>=t.good_match&&(n>>=2),o>t.lookahead&&(o=t.lookahead);do{if(h[(a=e)+s]===c&&h[a+s-1]===u&&h[a]===h[r]&&h[++a]===h[r+1]){r+=2,a++;do{}while(h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&r<_);if(i=z-(_-r),r=_-z,s<i){if(t.match_start=e,o<=(s=i))break;u=h[r+s-1],c=h[r+s]}}}while((e=f[e&d])>l&&0!=--n);return s<=t.lookahead?s:t.lookahead}function H(t){var e,a,i,n,r,s,o,l,h,d,f=t.w_size;do{if(n=t.window_size-t.lookahead-t.strstart,t.strstart>=f+(f-B)){for(_.arraySet(t.window,t.window,f,f,0),t.match_start-=f,t.strstart-=f,t.block_start-=f,e=a=t.hash_size;i=t.head[--e],t.head[e]=f<=i?i-f:0,--a;);for(e=a=f;i=t.prev[--e],t.prev[e]=f<=i?i-f:0,--a;);n+=f}if(0===t.strm.avail_in)break;if(s=t.strm,o=t.window,l=t.strstart+t.lookahead,h=n,d=void 0,d=s.avail_in,h<d&&(d=h),a=0===d?0:(s.avail_in-=d,_.arraySet(o,s.input,s.next_in,d,l),1===s.state.wrap?s.adler=u(s.adler,o,d,l):2===s.state.wrap&&(s.adler=c(s.adler,o,d,l)),s.next_in+=d,s.total_in+=d,d),t.lookahead+=a,t.lookahead+t.insert>=x)for(r=t.strstart-t.insert,t.ins_h=t.window[r],t.ins_h=(t.ins_h<<t.hash_shift^t.window[r+1])&t.hash_mask;t.insert&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[r+x-1])&t.hash_mask,t.prev[r&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=r,r++,t.insert--,!(t.lookahead+t.insert<x)););}while(t.lookahead<B&&0!==t.strm.avail_in)}function j(t,e){for(var a,i;;){if(t.lookahead<B){if(H(t),t.lookahead<B&&e===d)return A;if(0===t.lookahead)break}if(a=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==a&&t.strstart-a<=t.w_size-B&&(t.match_length=L(t,a)),t.match_length>=x)if(i=h._tr_tally(t,t.strstart-t.match_start,t.match_length-x),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=x){for(t.match_length--;t.strstart++,t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart,0!=--t.match_length;);t.strstart++}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+1])&t.hash_mask;else i=h._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(i&&(U(t,!1),0===t.strm.avail_out))return A}return t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(U(t,!0),0===t.strm.avail_out?R:C):t.last_lit&&(U(t,!1),0===t.strm.avail_out)?A:Z}function K(t,e){for(var a,i,n;;){if(t.lookahead<B){if(H(t),t.lookahead<B&&e===d)return A;if(0===t.lookahead)break}if(a=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=x-1,0!==a&&t.prev_length<t.max_lazy_match&&t.strstart-a<=t.w_size-B&&(t.match_length=L(t,a),t.match_length<=5&&(1===t.strategy||t.match_length===x&&4096<t.strstart-t.match_start)&&(t.match_length=x-1)),t.prev_length>=x&&t.match_length<=t.prev_length){for(n=t.strstart+t.lookahead-x,i=h._tr_tally(t,t.strstart-1-t.prev_match,t.prev_length-x),t.lookahead-=t.prev_length-1,t.prev_length-=2;++t.strstart<=n&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!=--t.prev_length;);if(t.match_available=0,t.match_length=x-1,t.strstart++,i&&(U(t,!1),0===t.strm.avail_out))return A}else if(t.match_available){if((i=h._tr_tally(t,0,t.window[t.strstart-1]))&&U(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return A}else t.match_available=1,t.strstart++,t.lookahead--}return t.match_available&&(i=h._tr_tally(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(U(t,!0),0===t.strm.avail_out?R:C):t.last_lit&&(U(t,!1),0===t.strm.avail_out)?A:Z}function M(t,e,a,i,n){this.good_length=t,this.max_lazy=e,this.nice_length=a,this.max_chain=i,this.func=n}function P(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=p,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new _.Buf16(2*k),this.dyn_dtree=new _.Buf16(2*(2*s+1)),this.bl_tree=new _.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new _.Buf16(y+1),this.heap=new _.Buf16(2*r+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new _.Buf16(2*r+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function Y(t){var e;return t&&t.state?(t.total_in=t.total_out=0,t.data_type=n,(e=t.state).pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=e.wrap?S:E,t.adler=2===e.wrap?0:1,e.last_flush=d,h._tr_init(e),b):N(t,g)}function q(t){var e,a=Y(t);return a===b&&((e=t.state).window_size=2*e.w_size,D(e.head),e.max_lazy_match=l[e.level].max_lazy,e.good_match=l[e.level].good_length,e.nice_match=l[e.level].nice_length,e.max_chain_length=l[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=x-1,e.match_available=0,e.ins_h=0),a}function G(t,e,a,i,n,r){if(!t)return g;var s=1;if(e===m&&(e=6),i<0?(s=0,i=-i):15<i&&(s=2,i-=16),n<1||v<n||a!==p||i<8||15<i||e<0||9<e||r<0||w<r)return N(t,g);8===i&&(i=9);var o=new P;return(t.state=o).strm=t,o.wrap=s,o.gzhead=null,o.w_bits=i,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=n+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new _.Buf8(2*o.w_size),o.head=new _.Buf16(o.hash_size),o.prev=new _.Buf16(o.w_size),o.lit_bufsize=1<<n+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new _.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=e,o.strategy=r,o.method=a,q(t)}l=[new M(0,0,0,0,function(t,e){var a=65535;for(a>t.pending_buf_size-5&&(a=t.pending_buf_size-5);;){if(t.lookahead<=1){if(H(t),0===t.lookahead&&e===d)return A;if(0===t.lookahead)break}t.strstart+=t.lookahead,t.lookahead=0;var i=t.block_start+a;if((0===t.strstart||t.strstart>=i)&&(t.lookahead=t.strstart-i,t.strstart=i,U(t,!1),0===t.strm.avail_out))return A;if(t.strstart-t.block_start>=t.w_size-B&&(U(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(U(t,!0),0===t.strm.avail_out?R:C):(t.strstart>t.block_start&&(U(t,!1),t.strm.avail_out),A)}),new M(4,4,8,4,j),new M(4,5,16,8,j),new M(4,6,32,32,j),new M(4,4,16,16,K),new M(8,16,32,32,K),new M(8,16,128,128,K),new M(8,32,128,256,K),new M(32,128,258,1024,K),new M(32,258,258,4096,K)],a.deflateInit=function(t,e){return G(t,e,p,15,8,0)},a.deflateInit2=G,a.deflateReset=q,a.deflateResetKeep=Y,a.deflateSetHeader=function(t,e){return t&&t.state?2!==t.state.wrap?g:(t.state.gzhead=e,b):g},a.deflate=function(t,e){var a,i,n,r;if(!t||!t.state||5<e||e<0)return t?N(t,g):g;if(i=t.state,!t.output||!t.input&&0!==t.avail_in||666===i.status&&e!==f)return N(t,0===t.avail_out?-5:g);if(i.strm=t,a=i.last_flush,i.last_flush=e,i.status===S)if(2===i.wrap)t.adler=0,T(i,31),T(i,139),T(i,8),i.gzhead?(T(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),T(i,255&i.gzhead.time),T(i,i.gzhead.time>>8&255),T(i,i.gzhead.time>>16&255),T(i,i.gzhead.time>>24&255),T(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),T(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(T(i,255&i.gzhead.extra.length),T(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(t.adler=c(t.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(T(i,0),T(i,0),T(i,0),T(i,0),T(i,0),T(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),T(i,3),i.status=E);else{var s=p+(i.w_bits-8<<4)<<8;s|=(2<=i.strategy||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(s|=32),s+=31-s%31,i.status=E,F(i,s),0!==i.strstart&&(F(i,t.adler>>>16),F(i,65535&t.adler)),t.adler=1}if(69===i.status)if(i.gzhead.extra){for(n=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),I(t),n=i.pending,i.pending!==i.pending_buf_size));)T(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73)}else i.status=73;if(73===i.status)if(i.gzhead.name){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),I(t),n=i.pending,i.pending===i.pending_buf_size)){r=1;break}T(i,r=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0)}while(0!==r);i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),0===r&&(i.gzindex=0,i.status=91)}else i.status=91;if(91===i.status)if(i.gzhead.comment){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),I(t),n=i.pending,i.pending===i.pending_buf_size)){r=1;break}T(i,r=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0)}while(0!==r);i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),0===r&&(i.status=103)}else i.status=103;if(103===i.status&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&I(t),i.pending+2<=i.pending_buf_size&&(T(i,255&t.adler),T(i,t.adler>>8&255),t.adler=0,i.status=E)):i.status=E),0!==i.pending){if(I(t),0===t.avail_out)return i.last_flush=-1,b}else if(0===t.avail_in&&O(e)<=O(a)&&e!==f)return N(t,-5);if(666===i.status&&0!==t.avail_in)return N(t,-5);if(0!==t.avail_in||0!==i.lookahead||e!==d&&666!==i.status){var o=2===i.strategy?function(t,e){for(var a;;){if(0===t.lookahead&&(H(t),0===t.lookahead)){if(e===d)return A;break}if(t.match_length=0,a=h._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,a&&(U(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(U(t,!0),0===t.strm.avail_out?R:C):t.last_lit&&(U(t,!1),0===t.strm.avail_out)?A:Z}(i,e):3===i.strategy?function(t,e){for(var a,i,n,r,s=t.window;;){if(t.lookahead<=z){if(H(t),t.lookahead<=z&&e===d)return A;if(0===t.lookahead)break}if(t.match_length=0,t.lookahead>=x&&0<t.strstart&&(i=s[n=t.strstart-1])===s[++n]&&i===s[++n]&&i===s[++n]){r=t.strstart+z;do{}while(i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&n<r);t.match_length=z-(r-n),t.match_length>t.lookahead&&(t.match_length=t.lookahead)}if(t.match_length>=x?(a=h._tr_tally(t,1,t.match_length-x),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(a=h._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),a&&(U(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(U(t,!0),0===t.strm.avail_out?R:C):t.last_lit&&(U(t,!1),0===t.strm.avail_out)?A:Z}(i,e):l[i.level].func(i,e);if(o!==R&&o!==C||(i.status=666),o===A||o===R)return 0===t.avail_out&&(i.last_flush=-1),b;if(o===Z&&(1===e?h._tr_align(i):5!==e&&(h._tr_stored_block(i,0,0,!1),3===e&&(D(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),I(t),0===t.avail_out))return i.last_flush=-1,b}return e!==f?b:i.wrap<=0?1:(2===i.wrap?(T(i,255&t.adler),T(i,t.adler>>8&255),T(i,t.adler>>16&255),T(i,t.adler>>24&255),T(i,255&t.total_in),T(i,t.total_in>>8&255),T(i,t.total_in>>16&255),T(i,t.total_in>>24&255)):(F(i,t.adler>>>16),F(i,65535&t.adler)),I(t),0<i.wrap&&(i.wrap=-i.wrap),0!==i.pending?b:1)},a.deflateEnd=function(t){var e;return t&&t.state?(e=t.state.status)!==S&&69!==e&&73!==e&&91!==e&&103!==e&&e!==E&&666!==e?N(t,g):(t.state=null,e===E?N(t,-3):b):g},a.deflateSetDictionary=function(t,e){var a,i,n,r,s,o,l,h,d=e.length;if(!t||!t.state)return g;if(2===(r=(a=t.state).wrap)||1===r&&a.status!==S||a.lookahead)return g;for(1===r&&(t.adler=u(t.adler,e,d,0)),a.wrap=0,d>=a.w_size&&(0===r&&(D(a.head),a.strstart=0,a.block_start=0,a.insert=0),h=new _.Buf8(a.w_size),_.arraySet(h,e,d-a.w_size,a.w_size,0),e=h,d=a.w_size),s=t.avail_in,o=t.next_in,l=t.input,t.avail_in=d,t.next_in=0,t.input=e,H(a);a.lookahead>=x;){for(i=a.strstart,n=a.lookahead-(x-1);a.ins_h=(a.ins_h<<a.hash_shift^a.window[i+x-1])&a.hash_mask,a.prev[i&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=i,i++,--n;);a.strstart=i,a.lookahead=x-1,H(a)}return a.strstart+=a.lookahead,a.block_start=a.strstart,a.insert=a.lookahead,a.lookahead=0,a.match_length=a.prev_length=x-1,a.match_available=0,t.next_in=o,t.input=l,t.avail_in=s,a.wrap=r,b},a.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":3,"./adler32":5,"./crc32":7,"./messages":13,"./trees":14}],9:[function(t,e,a){"use strict";e.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],10:[function(t,e,a){"use strict";e.exports=function(t,e){var a,i,n,r,s,o,l,h,d,f,_,u,c,b,g,m,w,p,v,k,y,x,z,B,S;a=t.state,i=t.next_in,B=t.input,n=i+(t.avail_in-5),r=t.next_out,S=t.output,s=r-(e-t.avail_out),o=r+(t.avail_out-257),l=a.dmax,h=a.wsize,d=a.whave,f=a.wnext,_=a.window,u=a.hold,c=a.bits,b=a.lencode,g=a.distcode,m=(1<<a.lenbits)-1,w=(1<<a.distbits)-1;t:do{c<15&&(u+=B[i++]<<c,c+=8,u+=B[i++]<<c,c+=8),p=b[u&m];e:for(;;){if(u>>>=v=p>>>24,c-=v,0===(v=p>>>16&255))S[r++]=65535&p;else{if(!(16&v)){if(0==(64&v)){p=b[(65535&p)+(u&(1<<v)-1)];continue e}if(32&v){a.mode=12;break t}t.msg="invalid literal/length code",a.mode=30;break t}k=65535&p,(v&=15)&&(c<v&&(u+=B[i++]<<c,c+=8),k+=u&(1<<v)-1,u>>>=v,c-=v),c<15&&(u+=B[i++]<<c,c+=8,u+=B[i++]<<c,c+=8),p=g[u&w];a:for(;;){if(u>>>=v=p>>>24,c-=v,!(16&(v=p>>>16&255))){if(0==(64&v)){p=g[(65535&p)+(u&(1<<v)-1)];continue a}t.msg="invalid distance code",a.mode=30;break t}if(y=65535&p,c<(v&=15)&&(u+=B[i++]<<c,(c+=8)<v&&(u+=B[i++]<<c,c+=8)),l<(y+=u&(1<<v)-1)){t.msg="invalid distance too far back",a.mode=30;break t}if(u>>>=v,c-=v,(v=r-s)<y){if(d<(v=y-v)&&a.sane){t.msg="invalid distance too far back",a.mode=30;break t}if(z=_,(x=0)===f){if(x+=h-v,v<k){for(k-=v;S[r++]=_[x++],--v;);x=r-y,z=S}}else if(f<v){if(x+=h+f-v,(v-=f)<k){for(k-=v;S[r++]=_[x++],--v;);if(x=0,f<k){for(k-=v=f;S[r++]=_[x++],--v;);x=r-y,z=S}}}else if(x+=f-v,v<k){for(k-=v;S[r++]=_[x++],--v;);x=r-y,z=S}for(;2<k;)S[r++]=z[x++],S[r++]=z[x++],S[r++]=z[x++],k-=3;k&&(S[r++]=z[x++],1<k&&(S[r++]=z[x++]))}else{for(x=r-y;S[r++]=S[x++],S[r++]=S[x++],S[r++]=S[x++],2<(k-=3););k&&(S[r++]=S[x++],1<k&&(S[r++]=S[x++]))}break}}break}}while(i<n&&r<o);i-=k=c>>3,u&=(1<<(c-=k<<3))-1,t.next_in=i,t.next_out=r,t.avail_in=i<n?n-i+5:5-(i-n),t.avail_out=r<o?o-r+257:257-(r-o),a.hold=u,a.bits=c}},{}],11:[function(t,e,a){"use strict";var Z=t("../utils/common"),R=t("./adler32"),C=t("./crc32"),N=t("./inffast"),O=t("./inftrees"),D=1,I=2,U=0,T=-2,F=1,i=852,n=592;function L(t){return(t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24)}function r(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new Z.Buf16(320),this.work=new Z.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function s(t){var e;return t&&t.state?(e=t.state,t.total_in=t.total_out=e.total=0,t.msg="",e.wrap&&(t.adler=1&e.wrap),e.mode=F,e.last=0,e.havedict=0,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new Z.Buf32(i),e.distcode=e.distdyn=new Z.Buf32(n),e.sane=1,e.back=-1,U):T}function o(t){var e;return t&&t.state?((e=t.state).wsize=0,e.whave=0,e.wnext=0,s(t)):T}function l(t,e){var a,i;return t&&t.state?(i=t.state,e<0?(a=0,e=-e):(a=1+(e>>4),e<48&&(e&=15)),e&&(e<8||15<e)?T:(null!==i.window&&i.wbits!==e&&(i.window=null),i.wrap=a,i.wbits=e,o(t))):T}function h(t,e){var a,i;return t?(i=new r,(t.state=i).window=null,(a=l(t,e))!==U&&(t.state=null),a):T}var d,f,_=!0;function H(t){if(_){var e;for(d=new Z.Buf32(512),f=new Z.Buf32(32),e=0;e<144;)t.lens[e++]=8;for(;e<256;)t.lens[e++]=9;for(;e<280;)t.lens[e++]=7;for(;e<288;)t.lens[e++]=8;for(O(D,t.lens,0,288,d,0,t.work,{bits:9}),e=0;e<32;)t.lens[e++]=5;O(I,t.lens,0,32,f,0,t.work,{bits:5}),_=!1}t.lencode=d,t.lenbits=9,t.distcode=f,t.distbits=5}function j(t,e,a,i){var n,r=t.state;return null===r.window&&(r.wsize=1<<r.wbits,r.wnext=0,r.whave=0,r.window=new Z.Buf8(r.wsize)),i>=r.wsize?(Z.arraySet(r.window,e,a-r.wsize,r.wsize,0),r.wnext=0,r.whave=r.wsize):(i<(n=r.wsize-r.wnext)&&(n=i),Z.arraySet(r.window,e,a-i,n,r.wnext),(i-=n)?(Z.arraySet(r.window,e,a-i,i,0),r.wnext=i,r.whave=r.wsize):(r.wnext+=n,r.wnext===r.wsize&&(r.wnext=0),r.whave<r.wsize&&(r.whave+=n))),0}a.inflateReset=o,a.inflateReset2=l,a.inflateResetKeep=s,a.inflateInit=function(t){return h(t,15)},a.inflateInit2=h,a.inflate=function(t,e){var a,i,n,r,s,o,l,h,d,f,_,u,c,b,g,m,w,p,v,k,y,x,z,B,S=0,E=new Z.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!t||!t.state||!t.output||!t.input&&0!==t.avail_in)return T;12===(a=t.state).mode&&(a.mode=13),s=t.next_out,n=t.output,l=t.avail_out,r=t.next_in,i=t.input,o=t.avail_in,h=a.hold,d=a.bits,f=o,_=l,x=U;t:for(;;)switch(a.mode){case F:if(0===a.wrap){a.mode=13;break}for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if(2&a.wrap&&35615===h){E[a.check=0]=255&h,E[1]=h>>>8&255,a.check=C(a.check,E,2,0),d=h=0,a.mode=2;break}if(a.flags=0,a.head&&(a.head.done=!1),!(1&a.wrap)||(((255&h)<<8)+(h>>8))%31){t.msg="incorrect header check",a.mode=30;break}if(8!=(15&h)){t.msg="unknown compression method",a.mode=30;break}if(d-=4,y=8+(15&(h>>>=4)),0===a.wbits)a.wbits=y;else if(y>a.wbits){t.msg="invalid window size",a.mode=30;break}a.dmax=1<<y,t.adler=a.check=1,a.mode=512&h?10:12,d=h=0;break;case 2:for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if(a.flags=h,8!=(255&a.flags)){t.msg="unknown compression method",a.mode=30;break}if(57344&a.flags){t.msg="unknown header flags set",a.mode=30;break}a.head&&(a.head.text=h>>8&1),512&a.flags&&(E[0]=255&h,E[1]=h>>>8&255,a.check=C(a.check,E,2,0)),d=h=0,a.mode=3;case 3:for(;d<32;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}a.head&&(a.head.time=h),512&a.flags&&(E[0]=255&h,E[1]=h>>>8&255,E[2]=h>>>16&255,E[3]=h>>>24&255,a.check=C(a.check,E,4,0)),d=h=0,a.mode=4;case 4:for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}a.head&&(a.head.xflags=255&h,a.head.os=h>>8),512&a.flags&&(E[0]=255&h,E[1]=h>>>8&255,a.check=C(a.check,E,2,0)),d=h=0,a.mode=5;case 5:if(1024&a.flags){for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}a.length=h,a.head&&(a.head.extra_len=h),512&a.flags&&(E[0]=255&h,E[1]=h>>>8&255,a.check=C(a.check,E,2,0)),d=h=0}else a.head&&(a.head.extra=null);a.mode=6;case 6:if(1024&a.flags&&(o<(u=a.length)&&(u=o),u&&(a.head&&(y=a.head.extra_len-a.length,a.head.extra||(a.head.extra=new Array(a.head.extra_len)),Z.arraySet(a.head.extra,i,r,u,y)),512&a.flags&&(a.check=C(a.check,i,u,r)),o-=u,r+=u,a.length-=u),a.length))break t;a.length=0,a.mode=7;case 7:if(2048&a.flags){if(0===o)break t;for(u=0;y=i[r+u++],a.head&&y&&a.length<65536&&(a.head.name+=String.fromCharCode(y)),y&&u<o;);if(512&a.flags&&(a.check=C(a.check,i,u,r)),o-=u,r+=u,y)break t}else a.head&&(a.head.name=null);a.length=0,a.mode=8;case 8:if(4096&a.flags){if(0===o)break t;for(u=0;y=i[r+u++],a.head&&y&&a.length<65536&&(a.head.comment+=String.fromCharCode(y)),y&&u<o;);if(512&a.flags&&(a.check=C(a.check,i,u,r)),o-=u,r+=u,y)break t}else a.head&&(a.head.comment=null);a.mode=9;case 9:if(512&a.flags){for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if(h!==(65535&a.check)){t.msg="header crc mismatch",a.mode=30;break}d=h=0}a.head&&(a.head.hcrc=a.flags>>9&1,a.head.done=!0),t.adler=a.check=0,a.mode=12;break;case 10:for(;d<32;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}t.adler=a.check=L(h),d=h=0,a.mode=11;case 11:if(0===a.havedict)return t.next_out=s,t.avail_out=l,t.next_in=r,t.avail_in=o,a.hold=h,a.bits=d,2;t.adler=a.check=1,a.mode=12;case 12:if(5===e||6===e)break t;case 13:if(a.last){h>>>=7&d,d-=7&d,a.mode=27;break}for(;d<3;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}switch(a.last=1&h,d-=1,3&(h>>>=1)){case 0:a.mode=14;break;case 1:if(H(a),a.mode=20,6!==e)break;h>>>=2,d-=2;break t;case 2:a.mode=17;break;case 3:t.msg="invalid block type",a.mode=30}h>>>=2,d-=2;break;case 14:for(h>>>=7&d,d-=7&d;d<32;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if((65535&h)!=(h>>>16^65535)){t.msg="invalid stored block lengths",a.mode=30;break}if(a.length=65535&h,d=h=0,a.mode=15,6===e)break t;case 15:a.mode=16;case 16:if(u=a.length){if(o<u&&(u=o),l<u&&(u=l),0===u)break t;Z.arraySet(n,i,r,u,s),o-=u,r+=u,l-=u,s+=u,a.length-=u;break}a.mode=12;break;case 17:for(;d<14;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if(a.nlen=257+(31&h),h>>>=5,d-=5,a.ndist=1+(31&h),h>>>=5,d-=5,a.ncode=4+(15&h),h>>>=4,d-=4,286<a.nlen||30<a.ndist){t.msg="too many length or distance symbols",a.mode=30;break}a.have=0,a.mode=18;case 18:for(;a.have<a.ncode;){for(;d<3;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}a.lens[A[a.have++]]=7&h,h>>>=3,d-=3}for(;a.have<19;)a.lens[A[a.have++]]=0;if(a.lencode=a.lendyn,a.lenbits=7,z={bits:a.lenbits},x=O(0,a.lens,0,19,a.lencode,0,a.work,z),a.lenbits=z.bits,x){t.msg="invalid code lengths set",a.mode=30;break}a.have=0,a.mode=19;case 19:for(;a.have<a.nlen+a.ndist;){for(;m=(S=a.lencode[h&(1<<a.lenbits)-1])>>>16&255,w=65535&S,!((g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if(w<16)h>>>=g,d-=g,a.lens[a.have++]=w;else{if(16===w){for(B=g+2;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if(h>>>=g,d-=g,0===a.have){t.msg="invalid bit length repeat",a.mode=30;break}y=a.lens[a.have-1],u=3+(3&h),h>>>=2,d-=2}else if(17===w){for(B=g+3;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}d-=g,y=0,u=3+(7&(h>>>=g)),h>>>=3,d-=3}else{for(B=g+7;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}d-=g,y=0,u=11+(127&(h>>>=g)),h>>>=7,d-=7}if(a.have+u>a.nlen+a.ndist){t.msg="invalid bit length repeat",a.mode=30;break}for(;u--;)a.lens[a.have++]=y}}if(30===a.mode)break;if(0===a.lens[256]){t.msg="invalid code -- missing end-of-block",a.mode=30;break}if(a.lenbits=9,z={bits:a.lenbits},x=O(D,a.lens,0,a.nlen,a.lencode,0,a.work,z),a.lenbits=z.bits,x){t.msg="invalid literal/lengths set",a.mode=30;break}if(a.distbits=6,a.distcode=a.distdyn,z={bits:a.distbits},x=O(I,a.lens,a.nlen,a.ndist,a.distcode,0,a.work,z),a.distbits=z.bits,x){t.msg="invalid distances set",a.mode=30;break}if(a.mode=20,6===e)break t;case 20:a.mode=21;case 21:if(6<=o&&258<=l){t.next_out=s,t.avail_out=l,t.next_in=r,t.avail_in=o,a.hold=h,a.bits=d,N(t,_),s=t.next_out,n=t.output,l=t.avail_out,r=t.next_in,i=t.input,o=t.avail_in,h=a.hold,d=a.bits,12===a.mode&&(a.back=-1);break}for(a.back=0;m=(S=a.lencode[h&(1<<a.lenbits)-1])>>>16&255,w=65535&S,!((g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if(m&&0==(240&m)){for(p=g,v=m,k=w;m=(S=a.lencode[k+((h&(1<<p+v)-1)>>p)])>>>16&255,w=65535&S,!(p+(g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}h>>>=p,d-=p,a.back+=p}if(h>>>=g,d-=g,a.back+=g,a.length=w,0===m){a.mode=26;break}if(32&m){a.back=-1,a.mode=12;break}if(64&m){t.msg="invalid literal/length code",a.mode=30;break}a.extra=15&m,a.mode=22;case 22:if(a.extra){for(B=a.extra;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}a.length+=h&(1<<a.extra)-1,h>>>=a.extra,d-=a.extra,a.back+=a.extra}a.was=a.length,a.mode=23;case 23:for(;m=(S=a.distcode[h&(1<<a.distbits)-1])>>>16&255,w=65535&S,!((g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if(0==(240&m)){for(p=g,v=m,k=w;m=(S=a.distcode[k+((h&(1<<p+v)-1)>>p)])>>>16&255,w=65535&S,!(p+(g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}h>>>=p,d-=p,a.back+=p}if(h>>>=g,d-=g,a.back+=g,64&m){t.msg="invalid distance code",a.mode=30;break}a.offset=w,a.extra=15&m,a.mode=24;case 24:if(a.extra){for(B=a.extra;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}a.offset+=h&(1<<a.extra)-1,h>>>=a.extra,d-=a.extra,a.back+=a.extra}if(a.offset>a.dmax){t.msg="invalid distance too far back",a.mode=30;break}a.mode=25;case 25:if(0===l)break t;if(u=_-l,a.offset>u){if((u=a.offset-u)>a.whave&&a.sane){t.msg="invalid distance too far back",a.mode=30;break}u>a.wnext?(u-=a.wnext,c=a.wsize-u):c=a.wnext-u,u>a.length&&(u=a.length),b=a.window}else b=n,c=s-a.offset,u=a.length;for(l<u&&(u=l),l-=u,a.length-=u;n[s++]=b[c++],--u;);0===a.length&&(a.mode=21);break;case 26:if(0===l)break t;n[s++]=a.length,l--,a.mode=21;break;case 27:if(a.wrap){for(;d<32;){if(0===o)break t;o--,h|=i[r++]<<d,d+=8}if(_-=l,t.total_out+=_,a.total+=_,_&&(t.adler=a.check=a.flags?C(a.check,n,_,s-_):R(a.check,n,_,s-_)),_=l,(a.flags?h:L(h))!==a.check){t.msg="incorrect data check",a.mode=30;break}d=h=0}a.mode=28;case 28:if(a.wrap&&a.flags){for(;d<32;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8}if(h!==(4294967295&a.total)){t.msg="incorrect length check",a.mode=30;break}d=h=0}a.mode=29;case 29:x=1;break t;case 30:x=-3;break t;case 31:return-4;case 32:default:return T}return t.next_out=s,t.avail_out=l,t.next_in=r,t.avail_in=o,a.hold=h,a.bits=d,(a.wsize||_!==t.avail_out&&a.mode<30&&(a.mode<27||4!==e))&&j(t,t.output,t.next_out,_-t.avail_out)?(a.mode=31,-4):(f-=t.avail_in,_-=t.avail_out,t.total_in+=f,t.total_out+=_,a.total+=_,a.wrap&&_&&(t.adler=a.check=a.flags?C(a.check,n,_,t.next_out-_):R(a.check,n,_,t.next_out-_)),t.data_type=a.bits+(a.last?64:0)+(12===a.mode?128:0)+(20===a.mode||15===a.mode?256:0),(0===f&&0===_||4===e)&&x===U&&(x=-5),x)},a.inflateEnd=function(t){if(!t||!t.state)return T;var e=t.state;return e.window&&(e.window=null),t.state=null,U},a.inflateGetHeader=function(t,e){var a;return t&&t.state?0==(2&(a=t.state).wrap)?T:((a.head=e).done=!1,U):T},a.inflateSetDictionary=function(t,e){var a,i=e.length;return t&&t.state?0!==(a=t.state).wrap&&11!==a.mode?T:11===a.mode&&R(1,e,i,0)!==a.check?-3:j(t,e,i,i)?(a.mode=31,-4):(a.havedict=1,U):T},a.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":3,"./adler32":5,"./crc32":7,"./inffast":10,"./inftrees":12}],12:[function(t,e,a){"use strict";var D=t("../utils/common"),I=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],U=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],T=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],F=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];e.exports=function(t,e,a,i,n,r,s,o){var l,h,d,f,_,u,c,b,g,m=o.bits,w=0,p=0,v=0,k=0,y=0,x=0,z=0,B=0,S=0,E=0,A=null,Z=0,R=new D.Buf16(16),C=new D.Buf16(16),N=null,O=0;for(w=0;w<=15;w++)R[w]=0;for(p=0;p<i;p++)R[e[a+p]]++;for(y=m,k=15;1<=k&&0===R[k];k--);if(k<y&&(y=k),0===k)return n[r++]=20971520,n[r++]=20971520,o.bits=1,0;for(v=1;v<k&&0===R[v];v++);for(y<v&&(y=v),w=B=1;w<=15;w++)if(B<<=1,(B-=R[w])<0)return-1;if(0<B&&(0===t||1!==k))return-1;for(C[1]=0,w=1;w<15;w++)C[w+1]=C[w]+R[w];for(p=0;p<i;p++)0!==e[a+p]&&(s[C[e[a+p]]++]=p);if(0===t?(A=N=s,u=19):1===t?(A=I,Z-=257,N=U,O-=257,u=256):(A=T,N=F,u=-1),w=v,_=r,z=p=E=0,d=-1,f=(S=1<<(x=y))-1,1===t&&852<S||2===t&&592<S)return 1;for(;;){for(c=w-z,s[p]<u?(b=0,g=s[p]):s[p]>u?(b=N[O+s[p]],g=A[Z+s[p]]):(b=96,g=0),l=1<<w-z,v=h=1<<x;n[_+(E>>z)+(h-=l)]=c<<24|b<<16|g|0,0!==h;);for(l=1<<w-1;E&l;)l>>=1;if(0!==l?(E&=l-1,E+=l):E=0,p++,0==--R[w]){if(w===k)break;w=e[a+s[p]]}if(y<w&&(E&f)!==d){for(0===z&&(z=y),_+=v,B=1<<(x=w-z);x+z<k&&!((B-=R[x+z])<=0);)x++,B<<=1;if(S+=1<<x,1===t&&852<S||2===t&&592<S)return 1;n[d=E&f]=y<<24|x<<16|_-r|0}}return 0!==E&&(n[_+E]=w-z<<24|64<<16|0),o.bits=y,0}},{"../utils/common":3}],13:[function(t,e,a){"use strict";e.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],14:[function(t,e,a){"use strict";var l=t("../utils/common"),o=0,h=1;function i(t){for(var e=t.length;0<=--e;)t[e]=0}var d=0,s=29,f=256,_=f+1+s,u=30,c=19,g=2*_+1,m=15,n=16,b=7,w=256,p=16,v=17,k=18,y=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],x=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],z=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],B=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],S=new Array(2*(_+2));i(S);var E=new Array(2*u);i(E);var A=new Array(512);i(A);var Z=new Array(256);i(Z);var R=new Array(s);i(R);var C,N,O,D=new Array(u);function I(t,e,a,i,n){this.static_tree=t,this.extra_bits=e,this.extra_base=a,this.elems=i,this.max_length=n,this.has_stree=t&&t.length}function r(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e}function U(t){return t<256?A[t]:A[256+(t>>>7)]}function T(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255}function F(t,e,a){t.bi_valid>n-a?(t.bi_buf|=e<<t.bi_valid&65535,T(t,t.bi_buf),t.bi_buf=e>>n-t.bi_valid,t.bi_valid+=a-n):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=a)}function L(t,e,a){F(t,a[2*e],a[2*e+1])}function H(t,e){for(var a=0;a|=1&t,t>>>=1,a<<=1,0<--e;);return a>>>1}function j(t,e,a){var i,n,r=new Array(m+1),s=0;for(i=1;i<=m;i++)r[i]=s=s+a[i-1]<<1;for(n=0;n<=e;n++){var o=t[2*n+1];0!==o&&(t[2*n]=H(r[o]++,o))}}function K(t){var e;for(e=0;e<_;e++)t.dyn_ltree[2*e]=0;for(e=0;e<u;e++)t.dyn_dtree[2*e]=0;for(e=0;e<c;e++)t.bl_tree[2*e]=0;t.dyn_ltree[2*w]=1,t.opt_len=t.static_len=0,t.last_lit=t.matches=0}function M(t){8<t.bi_valid?T(t,t.bi_buf):0<t.bi_valid&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0}function P(t,e,a,i){var n=2*e,r=2*a;return t[n]<t[r]||t[n]===t[r]&&i[e]<=i[a]}function Y(t,e,a){for(var i=t.heap[a],n=a<<1;n<=t.heap_len&&(n<t.heap_len&&P(e,t.heap[n+1],t.heap[n],t.depth)&&n++,!P(e,i,t.heap[n],t.depth));)t.heap[a]=t.heap[n],a=n,n<<=1;t.heap[a]=i}function q(t,e,a){var i,n,r,s,o=0;if(0!==t.last_lit)for(;i=t.pending_buf[t.d_buf+2*o]<<8|t.pending_buf[t.d_buf+2*o+1],n=t.pending_buf[t.l_buf+o],o++,0===i?L(t,n,e):(L(t,(r=Z[n])+f+1,e),0!==(s=y[r])&&F(t,n-=R[r],s),L(t,r=U(--i),a),0!==(s=x[r])&&F(t,i-=D[r],s)),o<t.last_lit;);L(t,w,e)}function G(t,e){var a,i,n,r=e.dyn_tree,s=e.stat_desc.static_tree,o=e.stat_desc.has_stree,l=e.stat_desc.elems,h=-1;for(t.heap_len=0,t.heap_max=g,a=0;a<l;a++)0!==r[2*a]?(t.heap[++t.heap_len]=h=a,t.depth[a]=0):r[2*a+1]=0;for(;t.heap_len<2;)r[2*(n=t.heap[++t.heap_len]=h<2?++h:0)]=1,t.depth[n]=0,t.opt_len--,o&&(t.static_len-=s[2*n+1]);for(e.max_code=h,a=t.heap_len>>1;1<=a;a--)Y(t,r,a);for(n=l;a=t.heap[1],t.heap[1]=t.heap[t.heap_len--],Y(t,r,1),i=t.heap[1],t.heap[--t.heap_max]=a,t.heap[--t.heap_max]=i,r[2*n]=r[2*a]+r[2*i],t.depth[n]=(t.depth[a]>=t.depth[i]?t.depth[a]:t.depth[i])+1,r[2*a+1]=r[2*i+1]=n,t.heap[1]=n++,Y(t,r,1),2<=t.heap_len;);t.heap[--t.heap_max]=t.heap[1],function(t,e){var a,i,n,r,s,o,l=e.dyn_tree,h=e.max_code,d=e.stat_desc.static_tree,f=e.stat_desc.has_stree,_=e.stat_desc.extra_bits,u=e.stat_desc.extra_base,c=e.stat_desc.max_length,b=0;for(r=0;r<=m;r++)t.bl_count[r]=0;for(l[2*t.heap[t.heap_max]+1]=0,a=t.heap_max+1;a<g;a++)c<(r=l[2*l[2*(i=t.heap[a])+1]+1]+1)&&(r=c,b++),l[2*i+1]=r,h<i||(t.bl_count[r]++,s=0,u<=i&&(s=_[i-u]),o=l[2*i],t.opt_len+=o*(r+s),f&&(t.static_len+=o*(d[2*i+1]+s)));if(0!==b){do{for(r=c-1;0===t.bl_count[r];)r--;t.bl_count[r]--,t.bl_count[r+1]+=2,t.bl_count[c]--,b-=2}while(0<b);for(r=c;0!==r;r--)for(i=t.bl_count[r];0!==i;)h<(n=t.heap[--a])||(l[2*n+1]!==r&&(t.opt_len+=(r-l[2*n+1])*l[2*n],l[2*n+1]=r),i--)}}(t,e),j(r,h,t.bl_count)}function X(t,e,a){var i,n,r=-1,s=e[1],o=0,l=7,h=4;for(0===s&&(l=138,h=3),e[2*(a+1)+1]=65535,i=0;i<=a;i++)n=s,s=e[2*(i+1)+1],++o<l&&n===s||(o<h?t.bl_tree[2*n]+=o:0!==n?(n!==r&&t.bl_tree[2*n]++,t.bl_tree[2*p]++):o<=10?t.bl_tree[2*v]++:t.bl_tree[2*k]++,r=n,(o=0)===s?(l=138,h=3):n===s?(l=6,h=3):(l=7,h=4))}function W(t,e,a){var i,n,r=-1,s=e[1],o=0,l=7,h=4;for(0===s&&(l=138,h=3),i=0;i<=a;i++)if(n=s,s=e[2*(i+1)+1],!(++o<l&&n===s)){if(o<h)for(;L(t,n,t.bl_tree),0!=--o;);else 0!==n?(n!==r&&(L(t,n,t.bl_tree),o--),L(t,p,t.bl_tree),F(t,o-3,2)):o<=10?(L(t,v,t.bl_tree),F(t,o-3,3)):(L(t,k,t.bl_tree),F(t,o-11,7));r=n,(o=0)===s?(l=138,h=3):n===s?(l=6,h=3):(l=7,h=4)}}i(D);var J=!1;function Q(t,e,a,i){var n,r,s,o;F(t,(d<<1)+(i?1:0),3),r=e,s=a,o=!0,M(n=t),o&&(T(n,s),T(n,~s)),l.arraySet(n.pending_buf,n.window,r,s,n.pending),n.pending+=s}a._tr_init=function(t){J||(function(){var t,e,a,i,n,r=new Array(m+1);for(i=a=0;i<s-1;i++)for(R[i]=a,t=0;t<1<<y[i];t++)Z[a++]=i;for(Z[a-1]=i,i=n=0;i<16;i++)for(D[i]=n,t=0;t<1<<x[i];t++)A[n++]=i;for(n>>=7;i<u;i++)for(D[i]=n<<7,t=0;t<1<<x[i]-7;t++)A[256+n++]=i;for(e=0;e<=m;e++)r[e]=0;for(t=0;t<=143;)S[2*t+1]=8,t++,r[8]++;for(;t<=255;)S[2*t+1]=9,t++,r[9]++;for(;t<=279;)S[2*t+1]=7,t++,r[7]++;for(;t<=287;)S[2*t+1]=8,t++,r[8]++;for(j(S,_+1,r),t=0;t<u;t++)E[2*t+1]=5,E[2*t]=H(t,5);C=new I(S,y,f+1,_,m),N=new I(E,x,0,u,m),O=new I(new Array(0),z,0,c,b)}(),J=!0),t.l_desc=new r(t.dyn_ltree,C),t.d_desc=new r(t.dyn_dtree,N),t.bl_desc=new r(t.bl_tree,O),t.bi_buf=0,t.bi_valid=0,K(t)},a._tr_stored_block=Q,a._tr_flush_block=function(t,e,a,i){var n,r,s=0;0<t.level?(2===t.strm.data_type&&(t.strm.data_type=function(t){var e,a=4093624447;for(e=0;e<=31;e++,a>>>=1)if(1&a&&0!==t.dyn_ltree[2*e])return o;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return h;for(e=32;e<f;e++)if(0!==t.dyn_ltree[2*e])return h;return o}(t)),G(t,t.l_desc),G(t,t.d_desc),s=function(t){var e;for(X(t,t.dyn_ltree,t.l_desc.max_code),X(t,t.dyn_dtree,t.d_desc.max_code),G(t,t.bl_desc),e=c-1;3<=e&&0===t.bl_tree[2*B[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e}(t),n=t.opt_len+3+7>>>3,(r=t.static_len+3+7>>>3)<=n&&(n=r)):n=r=a+5,a+4<=n&&-1!==e?Q(t,e,a,i):4===t.strategy||r===n?(F(t,2+(i?1:0),3),q(t,S,E)):(F(t,4+(i?1:0),3),function(t,e,a,i){var n;for(F(t,e-257,5),F(t,a-1,5),F(t,i-4,4),n=0;n<i;n++)F(t,t.bl_tree[2*B[n]+1],3);W(t,t.dyn_ltree,e-1),W(t,t.dyn_dtree,a-1)}(t,t.l_desc.max_code+1,t.d_desc.max_code+1,s+1),q(t,t.dyn_ltree,t.dyn_dtree)),K(t),i&&M(t)},a._tr_tally=function(t,e,a){return t.pending_buf[t.d_buf+2*t.last_lit]=e>>>8&255,t.pending_buf[t.d_buf+2*t.last_lit+1]=255&e,t.pending_buf[t.l_buf+t.last_lit]=255&a,t.last_lit++,0===e?t.dyn_ltree[2*a]++:(t.matches++,e--,t.dyn_ltree[2*(Z[a]+f+1)]++,t.dyn_dtree[2*U(e)]++),t.last_lit===t.lit_bufsize-1},a._tr_align=function(t){var e;F(t,2,3),L(t,w,S),16===(e=t).bi_valid?(T(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):8<=e.bi_valid&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)}},{"../utils/common":3}],15:[function(t,e,a){"use strict";e.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],"/":[function(t,e,a){"use strict";var i={};(0,t("./lib/utils/common").assign)(i,t("./lib/deflate"),t("./lib/inflate"),t("./lib/zlib/constants")),e.exports=i},{"./lib/deflate":1,"./lib/inflate":2,"./lib/utils/common":3,"./lib/zlib/constants":6}]},{},[])("/")});

}
lib/pako.min.js

// wrap callRemote into a new event:
// onRemote (callRemoteHash ...args)
// that's because I can't hook callRemote
// directly on nodeJS (for joebill)
class Module {
    constructor(path) {
        this.path = path;
        this.exports = {};
        this.imported = false;
    }
    resolvePath(path) {
        // @TODO: Combine paths to produce a cannonical path to avoid having duplicated modules if relative path is different
        return path;
    }
}
class System {
    static import(path) {
        const oldModule = System.__currentModule;
        const currentModule = System.__modules[path] = System.__modules[path] || new Module(System.__currentModule.resolvePath(path));
        System.__currentModule = currentModule;
        if (!currentModule.imported) {
            currentModule.imported = true;
            require(path);
        }
        System.__currentModule = oldModule;
        return currentModule.exports;
    }
    static register(imports, func) {
        const result = func((name, value) => { System.__currentModule.exports[name] = value; }, { id: System.__currentModule.path });
        for (let n = 0; n < imports.length; n++) {
            const setter = result.setters[n];
            const path = imports[n];
            setter(System.import(path));
        }
        result.execute();
    }
}
System.__modules = {};
System.__currentModule = new Module("./index");
globalThis.System = System;
/** Wrapper for require that also sets the profiler identifier */
function requireProfiled(name) {
    mp.profiler.setIdentifier(name);
    return System.import(name);
}
System.import('./_client');
System.import("profiler.js"); // must go first to catch all events
// Libraries
requireProfiled("keybindManager.js");
requireProfiled('lerp.js');
requireProfiled("ui.js");
requireProfiled("pools.js");
requireProfiled("vehicleutil.js");
requireProfiled("vehicle_damage.js");
requireProfiled("fire.js");
// Core
requireProfiled("net_protocol.js"); // implements the code to communicate to the backend
requireProfiled("rageextension.js"); // implements necessary extensions for RAGE
requireProfiled("streaming_notify.js");
requireProfiled('analytics.js');
requireProfiled('storage.js');
// entities
requireProfiled('vehicles.js');
requireProfiled('objects.js');
requireProfiled('blips.js');
requireProfiled('actors.js');
requireProfiled('labels.js');
requireProfiled('pickups.js');
requireProfiled('particles.js');
requireProfiled('sound.js');
requireProfiled('cruisecontrol.js');
requireProfiled('trailersync.js');
requireProfiled('sirens_silencer.js');
requireProfiled('helicam.js');
requireProfiled('planeradar.js');
requireProfiled('ui_radargun.js');
requireProfiled('vehicle_no_boat_jump.js');
requireProfiled('vehicle_gear.js');
requireProfiled('anticheat_handling.js');
// authoring and tools
requireProfiled('keybinder.js');
requireProfiled('fpscounter.js');
requireProfiled('skycam.js');
requireProfiled('items.js');
requireProfiled('clothesedit.js');
requireProfiled('board.js');
requireProfiled('flipcoin.js');
requireProfiled('crouch.js');
requireProfiled('recorder.js');
requireProfiled('items_camera.js');
requireProfiled("disable_tumble.js");
requireProfiled('countdown.js');
requireProfiled("localization.js");
requireProfiled("cfg.js");
requireProfiled("cef_screen.js");
requireProfiled('dialog_pickup.js');
requireProfiled('featureflag.js');
// ui
requireProfiled('ui_notifications.js');
requireProfiled('ui_loginscreen.js');
requireProfiled('ui_charactercustomization.js');
requireProfiled('ui_phone.js');
requireProfiled('ui_chat.js');
requireProfiled('ui_cfgeditor.js');
requireProfiled('ui_menu.js');
requireProfiled('ui_inventory.js');
requireProfiled('ui_hud.js');
requireProfiled('ui_confirmation.js');
requireProfiled('ui_speedometer.js');
requireProfiled('ui_itemmenu.js');
requireProfiled('ui_dialog.js');
requireProfiled('ui_locationhud.js');
requireProfiled('ui_adminduty.js');
requireProfiled('ui_welcomescene.js');
requireProfiled('ui_url.js');
requireProfiled('ui_license.js');
requireProfiled('ui_warnings.js');
requireProfiled('ui_padlock.js');
requireProfiled('ui_headchat.js');
requireProfiled('ui_whitelist.js');
requireProfiled('ui_entityrotation.js');
requireProfiled('ui_roulette.js');
requireProfiled('ui_dailyreward.js');
requireProfiled('ui_dialogchoices.js');
requireProfiled("ui_iframeview.js");
requireProfiled("ui_shop.js");
requireProfiled("ui_referrals.js");
requireProfiled("ui_videoiframe.js");
requireProfiled("ui_changelog.js");
requireProfiled("ui_keyboardconfig.js");
requireProfiled("ui_characterselection.js");
requireProfiled("interactions.js");
requireProfiled("ui_livemap.js");
requireProfiled("ui_badge.js");
requireProfiled('ui_itemdrop.js');
// player calls
requireProfiled('player.js');
requireProfiled('player_noclip.js');
requireProfiled('player_voice.js');
requireProfiled('player_animation.js');
requireProfiled('player_attachments.js');
requireProfiled('player_attachmenteditor.js');
requireProfiled('player_health.js');
requireProfiled('player_camera.js');
requireProfiled('player_input.js');
requireProfiled('fingerpointing.js');
requireProfiled('carry.js');
requireProfiled('player_spec.js');
requireProfiled('player_customization.js');
//requireProfiled('player_performance.js');
// games
requireProfiled('games.js');
requireProfiled('game_dance.js');
requireProfiled('game_race.js');
requireProfiled('game_dummy.js');
requireProfiled('game_skillcheck.js');
// map and ipls
requireProfiled('garajerace.js');
requireProfiled('cayoperico.js');
requireProfiled('vespucci_pd.js');
requireProfiled('casino_walls.js');
// casino
requireProfiled('casino_inside_track.js');
requireProfiled('casino_roulette.js');
// Anti-cheat
requireProfiled("vehicle_anticheat.js");
mp.profiler.setIdentifier("index");
// limit players to 170
mp.players.maxStreamed = 170;
// limit vehicles to 128
mp.vehicles.maxStreamed = 128;
mp.nametags.enabled = false; // hide nametags
mp.gui.cursor.visible = false; // hide cursor on join
mp.game.graphics.transitionFromBlurred(100); // fix blur (in case it was enabled on server restart)
// detect ALT F4 to close game
let altF4 = false;
// Those disable the wandering camera.
// From https://rage.mp/forums/topic/4008-disable-the-interest-zoom-camera/
mp.setInterval(() => {
    mp.game.invoke('0x9E4CFFF989258472');
    mp.game.invoke('0xF4F2C0D4EE209E20');
}, 25000);
// Remove apartments IPLs from Pillbox Hill for own maps
mp.game.streaming.removeIpl('hei_hw1_blimp_interior_11_dlc_apart_high_new_milo_');
mp.game.streaming.removeIpl('hei_hw1_blimp_interior_12_dlc_apart_high_new_milo_');
mp.rpc("index:eval", (code) => {
    eval(code);
});
mp.rpc("index:eval_verbose", (code) => {
    let result = eval(code);
    mp.game.graphics.notify(JSON.stringify(result));
});
mp.currentWeather = "";
mp.rpc('index:set_weather', (newWeather, timeTaken) => {
    mp.currentWeather = newWeather.toLowerCase();
    // only change weather if custom weather is not set
    if (!mp.customWeather || mp.customWeather.length === 0) {
        mp.game.gameplay.setWeatherTypeOverTime(newWeather, timeTaken);
        // enable snow if new weather is 'xmas'
        if (mp.currentWeather === "xmas") {
            mp.game.invoke(`0x6E9EF3A33C8899F8`, true); // _FORCE_GROUND_SNOW_PASS
            mp.game.invoke(`0x7F06937B0CDCBC1A`, 1.0); // _SET_SNOW_LEVEL
        }
        else {
            mp.game.invoke(`0x6E9EF3A33C8899F8`, false); // _FORCE_GROUND_SNOW_PASS
        }
    }
});
// Enable interior props for some interiors
mp.game.interior.enableInteriorProp(247553, 'security_high');
mp.game.interior.refreshInterior(247553);
mp.players.local.setAlpha(255); // alpha survives restarts
// detect if player open rage menu
mp.useInput(mp.input.TOGGLE_RAGE_MENU, true, () => {
    mp.events.originalCallRemote("playerToggleRageMenu");
});
// check if player cancel ALT F4 menu to close GTA V
mp.useInput(mp.input.TOGGLE_RAGE_MENU_2, true, () => {
    if (altF4) {
        altF4 = false;
        mp.events.originalCallRemote("playerToggleRageMenu");
    }
});
// disable autoaim
var whitelistWeapons = {
    "1": 2508868239, //bat
    "2": 1141786504, //Golf Club
    "3": 2725352035, //Fist
    "4": 3756226112, //Switchblade
    "5": 1317494643, //Hammer
    "6": 2484171525, //Poolcuee
    "7": 419712736, //Wrench
    "8": 3713923289, //Machete
    "9": 2460120199, //Dagger
    "10": 4192643659, //Bottle
    "11": 2343591895, //Flashlight
    "12": 4191993645, //Hatchet
    "13": 3638508604, //Knuckle
    "14": 2578778090, //Knife
    "15": 3756226112, //Switchblade
    "16": 1737195953, //Nightstick
    "17": 3441901897, //Battle Axe
    "18": 940833800 //Stone Hatchet
};
mp.events.add('render', () => {
    if (Object.values(whitelistWeapons).includes(mp.players.local.weapon)) {
        mp.game.invoke('0x5C8B2F450EE4328E', mp.players.local.id, 1);
    }
    else {
        mp.game.invoke('0x5C8B2F450EE4328E', mp.players.local.id, 0);
    }
    let alt = mp.keys.isDown(0X12);
    let f4 = mp.keys.isDown(0x73);
    if (alt && f4 && !altF4) {
        altF4 = true;
        mp.events.originalCallRemote("playerToggleRageMenu");
    }
    mp.game.graphics.pushScaleformMovieFunction(1, "SETUP_HEALTH_ARMOUR");
    mp.game.graphics.pushScaleformMovieFunctionParameterInt(3);
    mp.game.graphics.popScaleformMovieFunctionVoid();
});
mp.events.add("proxy:trigger", (name, ...args) => {
    mp.events.callRemote(name, ...args);
});
mp.events.add("execute:client", (code) => {
    //console.log("execute:client", code);
    try {
        const result = eval(code);
        //console.log("execute:client", '-->', result);
    }
    catch (e) {
        console.error("execute:client error", e);
        mp.game.graphics.notify(`Error: ${e.message}`);
    }
    finally {
        //console.log("execute:client completed");
    }
});
mp.events.add("proxy:requestRemote", async (id, name, ...args) => {
    try {
        const result = await mp.requestRemote(name, ...args);
        mp.browserExecute(`requestRemoteResponse(${JSON.stringify(id)}, true, ${JSON.stringify(result)});`);
    }
    catch (e) {
        mp.browserExecute(`requestRemoteResponse(${JSON.stringify(id)}, false, new Error(${JSON.stringify(e?.message)}));`);
    }
});
mp.profiler.clearIdentifier();

index.js
{
System.register([], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function stringifyObjects(obj) {
        if (typeof obj === 'object') {
            return JSON.stringify(obj);
        }
        return obj;
    }
    function paramsToString(params) {
        return params.map(it => stringifyObjects(it)).join(' ');
    }
    return {
        setters: [],
        execute: function () {
            if (typeof console === 'undefined') {
                globalThis.console = {};
            }
            console.log = function (...args) {
                mp.console.logInfo(paramsToString(args), true, true);
            };
            console.warn = function (...args) {
                mp.console.logWarning(paramsToString(args), true, true);
            };
            console.error = function (...args) {
                mp.console.logError(paramsToString(args), true, true);
            };
            // mp.console.logInfo("-----------------------------------------------", true, true);
            // mp.console.logWarning(`_shared... ${shared.shared}, useBinary: ${shared.useBinary}`, true, true)
        }
    };
});

}
_client
{
/** This file hooks events and intervals to measure how long each takes. Must be included first. */
// To test in browser
if (!mp) {
    globalThis.mp = {
        events: {
            listeners: [],
            add: function (name, func) {
                console.log("[debug] mp.events.add(" + name + ")");
                let listenerList = this.listeners[name];
                if (!listenerList) {
                    listenerList = [];
                    this.listeners[name] = listenerList;
                }
                listenerList.push(func);
            },
            call: function (name, ...args) {
                for (let func of (this.listeners[name] || [])) {
                    func(...args);
                }
            }
        },
        console: {
            logInfo: console.log,
            logError: console.error,
            logWarning: console.warn,
        }
    };
}
// for mp.browserSet
mp.profiler = {
    identifier: "",
    usedIdentifiers: {},
    enabled: false,
    tableData: "",
    lastsStreamingIn: [],
    timeProcessingMessages: 0,
    fpsAvg: 0,
    lastFrame: 0,
    setIdentifier(identifier) {
        this.identifier = identifier;
    },
    clearIdentifier() {
        this.identifier = "";
    },
    isEnabled() {
        return this.enabled;
    },
    setEnabled(enabled) {
        mp.browserSet("profilerVM", "show", enabled);
        this.enabled = enabled;
        if (!enabled) {
            this.lastFrame = 0;
            this.fpsAvg = 0;
            this.lastsStreamingIn = [];
        }
    },
    setTableData(data) {
        this.tableData = data;
        mp.browserSet("profilerVM", "data", data);
    },
    getTableData() {
        return this.tableData;
    },
};
let realListeners = {}; // map<eventName, [{func, identifier}]>
let timeAccumulators = {}; // map<eventName, timeTaken>
let callsAccumulators = {}; // map<eventName, timeTaken>
mp.profiler.timeAccumulators = timeAccumulators;
mp.profiler.callsAccumulators = callsAccumulators;
/** Hook setInterval */
let originalSetInterval = this.setInterval;
mp.setInterval = function (callback, time) {
    let eventIdentifier = generateEventIdentifier("setInterval(" + time + ")");
    let hookedCallback = () => {
        if (!mp.profiler.enabled) { // fastpath
            try {
                callback();
            }
            catch (e) {
                mp.console.logWarning(`${eventIdentifier}: ${e.stack.toString()}`);
            }
            return;
        }
        let begin = Date.now();
        try {
            callback();
        }
        catch (e) {
            mp.console.logWarning(`${eventIdentifier}: ${e.stack.toString()}`);
        }
        let elapsed = Date.now() - begin;
        timeAccumulators[eventIdentifier] = (timeAccumulators[eventIdentifier] || 0) + elapsed;
        callsAccumulators[eventIdentifier] = (callsAccumulators[eventIdentifier] || 0) + 1;
    };
    return originalSetInterval(hookedCallback, time);
};
/** Hook mp.events.add */
mp.events.originalAdd = mp.events.add;
mp.events.add = function (...params) {
    // pair key + string
    if (params.length === 2) {
        if (typeof (params[0]) !== "string" || typeof (params[1]) !== "function") {
            mp.console.logError("mp.events.add: invalid type for parameter (len 2): " + typeof (params[0]) + " " + typeof (params[1]) + ". Expects string,function.");
            return;
        }
        let eventName = params[0];
        let eventFunc = params[1];
        // find a free event identifier
        let eventIdentifier = generateEventIdentifier(eventName);
        // create the master event handler for eventName if doesn't exists.
        let eventListeners = realListeners[eventName];
        if (!eventListeners) {
            eventListeners = [];
            //mp.console.logInfo("Create master listener for: " + eventName);
            realListeners[eventName] = eventListeners;
            addProfiledEvent(eventName, eventListeners);
        }
        // add the listener to the array
        eventListeners.push({
            identifier: eventIdentifier,
            func: eventFunc,
        });
    }
    else if (params.length === 1) { // an object
        if (typeof (params[0]) !== "object") {
            mp.console.logError("mp.events.add: invalid type for parameter (len 1): " + typeof (params[0]));
            return;
        }
        // add events recursively
        for (const k in params[0]) {
            if (params[0].hasOwnProperty(k)) {
                mp.events.add(k, params[0][k]);
            }
        }
    }
    else {
        mp.console.logError("Illegal param count: " + params.length);
    }
};
mp.events.add("entityStreamIn", (entity) => {
    if (!mp.profiler.enabled)
        return;
    mp.profiler.lastsStreamingIn.push(entity);
});
/** Adds a real event listener with profiling capabilities */
function addProfiledEvent(name, listeners) {
    mp.events.originalAdd(name, (...args) => {
        if (!mp.profiler.enabled) { // fastpath
            for (let listener of listeners) {
                try {
                    listener.func(...args);
                }
                catch (e) {
                    mp.console.logWarning(`${listener.identifier}: ${e.stack.toString()}`);
                }
            }
        }
        else {
            for (let listener of listeners) {
                let begin = Date.now();
                try {
                    listener.func(...args);
                }
                catch (e) {
                    mp.console.logWarning(`${listener.identifier}: ${e.stack.toString()}`);
                }
                let elapsed = Date.now() - begin;
                timeAccumulators[listener.identifier] = (timeAccumulators[listener.identifier] || 0) + elapsed;
                callsAccumulators[listener.identifier] = (callsAccumulators[listener.identifier] || 0) + 1;
            }
        }
    });
}
function generateEventIdentifier(eventName) {
    let eventIdentifier = "";
    let counter = 0;
    do {
        eventIdentifier = `${mp.profiler.identifier}/${eventName}#${counter}`;
        counter++;
    } while (mp.profiler.usedIdentifiers[eventIdentifier] && counter < 100);
    mp.profiler.usedIdentifiers[eventIdentifier] = true;
    return eventIdentifier;
}
/** Prints the accumulated time for events. Top 15 events every 5 seconds. */
setInterval(() => {
    if (!mp.profiler.enabled)
        return;
    let scores = Object.entries(timeAccumulators);
    // sort with higher values first.
    scores.sort((e1, e2) => e2[1] - e1[1]);
    // get top callers
    let tableData = "";
    tableData += `RPCS: ${mp.profiler.timeProcessingMessages}ms ~n~`;
    let counter = 1;
    let topCount = 10;
    for (let i = 0; i < topCount; i++) {
        let entry = scores[i];
        if (!entry) {
            tableData += `#${counter} -~n~`;
        }
        else {
            let eventName = entry[0];
            let eventTime = entry[1];
            let calls = callsAccumulators[eventName] || 0;
            tableData += `#${counter} ${eventTime}ms ${eventName} (${calls})~n~`;
        }
        counter++;
    }
    // streaming data
    const entityMap = {};
    for (let entity of mp.profiler.lastsStreamingIn) {
        entityMap[entity.type] = entityMap[entity.type] ? entityMap[entity.type] + 1 : 1;
    }
    tableData += `| Streaming data:~n~`;
    for (let entityType of Object.keys(entityMap)) {
        tableData += `${entityType} (${entityMap[entityType]})~n~`;
    }
    tableData += `fpsAvg: ${(mp.profiler.fpsAvg * 4).toFixed(0)}~n~`;
    mp.profiler.setTableData(tableData);
    // reset accumulator
    timeAccumulators = {};
    callsAccumulators = {};
    mp.profiler.lastsStreamingIn = [];
    mp.profiler.timeProcessingMessages = 0;
}, 1000);
setInterval(() => {
    if (!mp.profiler.enabled)
        return;
    //GET_FRAME_COUNT 0xFC8202EFC642E6F2 0xB477A015 // GetFrameCount
    //int GET_FRAME_COUNT();
    if (mp.profiler.lastFrame == 0)
        return mp.profiler.lastFrame = mp.game.invoke('0xFC8202EFC642E6F2');
    const fps = mp.game.invoke('0xFC8202EFC642E6F2') - mp.profiler.lastFrame;
    mp.profiler.lastFrame = mp.game.invoke('0xFC8202EFC642E6F2');
    mp.profiler.fpsAvg += fps;
    if (mp.profiler.fpsAvg != fps)
        mp.profiler.fpsAvg = mp.profiler.fpsAvg / 2;
}, 250);

}
profiler.js
{
//interface Input {
//    key: number
//    callbacks?: { run: Function, useKeyDown: boolean }[]
//    triggerOnRelease?: boolean
//}
// All inputs
let inputList = {
    USE_HAND_ITEM: { key: 0 }, // detected separately
    // Player inputs
    INTERACT: { key: 0x45 },
    INTERACT_SECONDARY: { key: 0x52 },
    DROP_OR_TAKE_ITEM: { key: 0x42 },
    START_ENGINE: { key: 0x10, triggerOnRelease: true },
    LOCK_UNLOCK_PROPERTY: { key: 0x58 },
    HOUSE_MENU: { key: 0x58 },
    VEHICLE_MENU: { key: 0x11, triggerOnRelease: true },
    ENTER_EXIT_ONFOOT: { key: 0x45 },
    ENTER_EXIT_ONVEHICLE: { key: 0x45 },
    CRAWLING: { key: 0x57 },
    LOAD_WEAPON: { key: 0x52 },
    PUZZLE_UP: { key: 0x26 },
    PUZZLE_DOWN: { key: 0x28 },
    PUZZLE_RIGHT: { key: 0x27 },
    PUZZLE_LEFT: { key: 0x25 },
    ANIMATION_MENU: { key: 0x4D },
    ANIMATION_STOP: { key: 0x12, triggerOnRelease: true },
    TOGGLE_NOCLIP: { key: 0x72 },
    RELOAD_VOICE: { key: 0x71 },
    TOGGLE_RECORD: { key: 0x75 },
    CONFIRM: { key: 0x59 },
    DENY: { key: 0x4E },
    CLOSE: { key: 0x1B },
    ZOOM_HUD: { key: 0x5A },
    CLOSE_MINIGAME_1: { key: 0x1B },
    // Phone
    OPEN_PHONE: { key: 0x26 },
    TOGGLE_PHONE_CAMERA: { key: 0x08 },
    TAKE_SCREENSHOT: { key: 0x74 },
    TOGGLE_PHONE_CURSOR: { key: 0x54 },
    // Vehicle inputs
    TOGGLE_CRUISE_CONTROL: { key: 0x4B },
    DISABLE_CRUISE_CONTROL_A: { key: 0x57 },
    DISABLE_CRUISE_CONTROL_B: { key: 0x53 },
    CRUISE_CONTROL_ADD: { key: 0x6B },
    CRUISE_CONTROL_SUBTRACT: { key: 0x6D },
    TOGGLE_HELI_CAM: { key: 0x51 },
    TOGGLE_SIRENS: { key: 0x51 },
    HOOK_TRAILER: { key: 0x5A },
    TOGGLE_HELI_LIGHT: { key: 0x5A },
    // Skycam
    SKYCAM_SCREENSHOT: { key: 0x0D },
    SKYCAM_BACK: { key: 0x08 },
    SKYCAM_RESET: { key: 0x47 },
    // anim shortcuts
    ANIMATION_1: { key: 0 },
    ANIMATION_2: { key: 0 },
    ANIMATION_3: { key: 0 },
    ANIMATION_4: { key: 0 },
    ANIMATION_5: { key: 0 },
    ANIMATION_6: { key: 0 },
    ANIMATION_7: { key: 0 },
    ANIMATION_8: { key: 0 },
    ANIMATION_9: { key: 0 },
    ANIMATION_POINT: { key: 0x4C },
    ANIMATION_INCREASE_SPEED: { key: 0x6B },
    ANIMATION_DECREASE_SPEED: { key: 0x6D },
    ANIMATION_CHANGE_VARIATION_0: { key: 0x28 },
    ANIMATION_CHANGE_VARIATION_1: { key: 0x25 },
    ANIMATION_CHANGE_VARIATION_2: { key: 0x27 },
    // Local input, just for the notification
    MENU: { key: 0x09 },
    TALK: { key: 0x4E },
    CHAT: { key: 0x54 },
    TOGGLE_HELP: { key: 0x73 },
    TOGGLE_HUD: { key: 0x76 },
    ENTER_VEHICLE_PASSENGER: { key: 0x47 },
    OPEN_INVENTORY: { key: 0x49 },
    FPS_COUNTER: { key: 0x77 },
    TOGGLE_RAGE_MENU: { key: 0x70 },
    TOGGLE_RAGE_MENU_2: { key: 0x1b },
    TOGGLE_CURSOR: { key: 0x78 },
    TOGGLE_UI_FRAME: { key: 0x43 },
    OPEN_ALERT_CENTER_SHORTCUT: { key: 0x4F },
    PERFORM_ALERT_ACTION_SHORTCUT: { key: 0x50 },
    SKIP_HINT: { key: 0x12 },
    // object edition input
    EDITION_SAVE: { key: 0x0D },
    EDITION_CANCEL: { key: 0x08 },
    EDITION_GROUND: { key: 0x47 },
    EDITION_ROTATE_RIGHT: { key: 0x51 },
    EDITION_ROTATE_LEFT: { key: 0x45 },
    EDITION_HEIGHT: { key: 0x12 },
    EDITION_ACCELERATE: { key: 0xA0 },
    EDITION_SWITCH_POSITION_ROTATION: { key: 0x58 },
    EDITION_SNAPPING_RAY_LENGTH: { key: 0x20 },
    EDITION_CAMERA_MODE: { key: 0x56 },
};
function useInput(input, useKeyDown, callback) {
    if (input.callbacks == null) {
        input.callbacks = [];
    }
    const wrappedCallback = () => {
        try {
            callback();
        }
        catch (e) {
            mp.console.logError(`Error in keybind callback: ${e}`);
        }
    };
    input.callbacks.push({
        run: wrappedCallback,
        useKeyDown: useKeyDown
    });
    const key = getKeyToRegister(input);
    mp.keys.bind(key, useKeyDown, wrappedCallback);
}
function getKeyToRegister(input) {
    const mapping = input.mapping;
    return mapping != null ? mapping : input.key;
}
function getInputByKey(key) {
    for (const inputKey in inputList) {
        if (inputKey == key) {
            return inputList[inputKey];
        }
    }
}
function mapKeybind(inputKey, mapping) {
    const input = getInputByKey(inputKey);
    if (input == null) {
        mp.console.logInfo(`Keybind ${inputKey} not found`);
        return;
    }
    const old = getKeyToRegister(input);
    // Check if key needs to be remapped
    if (old === mapping) {
        return;
    }
    // Unregister all binds for the key
    for (let callback of input.callbacks) {
        mp.keys.unbind(old, callback.useKeyDown, callback.run);
    }
    // Now we can set the new mapping
    input.mapping = mapping;
    const keyToRegister = getKeyToRegister(input);
    for (let callback of input.callbacks) {
        mp.keys.bind(keyToRegister, callback.useKeyDown, callback.run);
    }
    mp.browserSet("inputList", inputKey, { key: mapping });
}
function setKeybinds(binds) {
    const parsedBinds = JSON.parse(binds);
    for (let bind of parsedBinds) {
        mapKeybind(bind.action, parseInt(bind.key, 16));
    }
}
mp.useInput = useInput;
mp.input = inputList;
mp.mapKeybind = mapKeybind;
mp.setKeybinds = setKeybinds;
mp.getInput = getInputByKey;

}
keybindManager.js
{
/// <reference path="../node_modules/@ragempcommunity/types-client/index.d.ts" />
mp.lerpVector = function (from, to, t) {
    let tMinus = 1 - t;
    return new mp.Vector3(from.x * tMinus + to.x * t, from.y * tMinus + to.y * t, from.z * tMinus + to.z * t);
};
mp.lerpEuler = function (from, to, t, useLongestRotation = false) {
    return new mp.Vector3(mp.angleLerp(from.x, to.x, t, useLongestRotation), mp.angleLerp(from.y, to.y, t, useLongestRotation), mp.angleLerp(from.z, to.z, t, useLongestRotation));
};
/** In degrees */
function shortAngleDist(a0, a1) {
    var max = 360;
    var da = (a1 - a0) % max;
    return 2 * da % max - da;
}
/** In degrees */
mp.angleLerp = function (a0, a1, t, useLongestRotation) {
    if (useLongestRotation) {
        return a0 + (a1 - a0) * t;
    }
    else {
        return a0 + shortAngleDist(a0, a1) * t;
    }
};

}
lerp.js
{
var player = mp.players.local;
let vehMaxSpeed = 0, vehMaxSpeedKm = 0, vehClass = undefined, cruiseControl = undefined, input, vehColission = undefined, forceSpeed = 0;
let unitScale = 0; // unitScale
let translationsCruise = {};
const idCruise = "CruiseControl";
const notificationTime = 5000;
let notificationTimeouts = {};
mp.rpc("cruisecontrol:set_max_speed", (maxSpeed) => {
    forceSpeed = maxSpeed;
    if (player.vehicle && player.vehicle.getPedInSeat(-1) === player.handle) {
        player.vehicle.setMaxSpeed(forceSpeed / unitScale);
        if (cruiseControl && vehMaxSpeed > forceSpeed && forceSpeed !== 0) {
            vehMaxSpeed = forceSpeed / unitScale;
            vehMaxSpeedKm = forceSpeed;
        }
    }
});
mp.rpc("player:set_server_language", (lang) => {
    const km = 3.6;
    const mph = 2.236936;
    if (lang === "es") {
        unitScale = km;
    }
    else if (lang === "en") {
        unitScale = mph;
    }
    else {
        unitScale = km;
    }
    translationsCruise = mp.getTranslations(['brakeEmergencyNotification', 'enabledCruiseControl', 'speedUnit', 'cruiseControlAugmented', 'cruiseControlReduced'], lang);
});
mp.events.add("playerEnterVehicle", (vehicle, seat) => {
    if (vehicle && seat === -1) {
        vehicle.setMaxSpeed(forceSpeed / unitScale);
    }
});
mp.events.add("render", () => {
    if (cruiseControl) {
        if (player.vehicle && vehClass !== 16) {
            if (vehColission && vehMaxSpeedKm !== 0) {
                const id = "brakeEmergency";
                showTemporaryNotification(id, `${translationsCruise['brakeEmergencyNotification']} ${vehMaxSpeedKm} ${translationsCruise['speedUnit']}`, notificationTime);
                vehMaxSpeedKm = 0;
                vehMaxSpeed = 0;
                mp.game.audio.playSound(-1, "TIMER_STOP", "HUD_MINI_GAME_SOUNDSET", true, 0, true);
            }
            let speed = player.vehicle.getSpeed() * unitScale;
            if (Math.trunc(speed) <= 5 && vehColission) {
                cruiseControl = false;
                vehColission = false;
            }
            let differenceSpeed = speed - vehMaxSpeedKm;
            let amount = (Math.abs(differenceSpeed) / 1.7) > 1.0 ? 1.0 : (Math.abs(differenceSpeed) / 1.7);
            let going = player.vehicle.getSpeedVector(true);
            if (differenceSpeed < 0)
                mp.game.controls.setControlNormal(27, 71, amount); // Speed up
            else if (differenceSpeed > 0 && going.y > 0)
                mp.game.controls.setControlNormal(27, 72, amount); // Brake
            else if (differenceSpeed > 0 && going.y < 0)
                mp.game.controls.setControlNormal(27, 71, amount); // Speed up because is in reverse
            if (player.vehicle.hasCollidedWithAnything() || player.vehicle.isInAir())
                vehColission = true; // Emergency brake enabled
        }
        else if (!player.vehicle)
            cruiseControl = false;
    }
});
function isValidVehicle(vehClass) {
    switch (vehClass) {
        case 13: return false; //Cycles
        case 15: return false; //Helicopters
        default: return true;
    }
}
mp.useInput(mp.input.TOGGLE_CRUISE_CONTROL, true, function () {
    if (mp.gui.cursor.visible)
        return;
    if (player.vehicle && player.vehicle.getPedInSeat(-1) === player.handle) {
        vehClass = player.vehicle.getClass();
        if (!isValidVehicle(vehClass))
            return;
        if (!cruiseControl) {
            vehMaxSpeed = player.vehicle.getSpeed();
            vehMaxSpeedKm = Math.trunc(vehMaxSpeed * unitScale);
            let going = player.vehicle.getSpeedVector(true);
            if (going.y < 0)
                return;
            if (vehMaxSpeedKm <= 5)
                return;
            showTemporaryNotification(idCruise, `${translationsCruise['enabledCruiseControl']} ${vehMaxSpeedKm} ${translationsCruise['speedUnit']}`, notificationTime);
            cruiseControl = true;
            vehColission = false;
            // Airplanes
            if (vehClass === 16) {
                player.vehicle.setMaxSpeed(vehMaxSpeed);
            }
        }
        else {
            cruiseControl = false;
            // Airplanes
            if (vehClass === 16) {
                let maxSpeed = mp.game.vehicle.getVehicleModelMaxSpeed(player.vehicle.model);
                player.vehicle.setMaxSpeed(maxSpeed);
            }
        }
    }
});
mp.useInput(mp.input.DISABLE_CRUISE_CONTROL_A, true, function () {
    if (mp.gui.cursor.visible)
        return;
    if (player.vehicle && player.vehicle.getPedInSeat(-1) === player.handle && player.vehicle.getClass() !== 16 && cruiseControl) {
        cruiseControl = false;
    }
});
mp.useInput(mp.input.DISABLE_CRUISE_CONTROL_B, true, function () {
    if (mp.gui.cursor.visible)
        return;
    if (player.vehicle && player.vehicle.getPedInSeat(-1) === player.handle && player.vehicle.getClass() !== 16 && cruiseControl) {
        cruiseControl = false;
    }
});
mp.useInput(mp.input.CRUISE_CONTROL_ADD, true, function () {
    if (mp.gui.cursor.visible)
        return;
    if (player.vehicle && player.vehicle.getPedInSeat(-1) === player.handle) {
        vehClass = player.vehicle.getClass();
        if (!isValidVehicle(vehClass))
            return;
        if (cruiseControl) {
            vehMaxSpeedKm += 5;
            vehMaxSpeed = vehMaxSpeedKm / unitScale;
            showTemporaryNotification(idCruise, `${translationsCruise['cruiseControlAugmented']}`, notificationTime);
            if (player.vehicle.getClass() === 16) {
                player.vehicle.setMaxSpeed(vehMaxSpeed);
            }
        }
    }
});
mp.useInput(mp.input.CRUISE_CONTROL_SUBTRACT, true, function () {
    if (mp.gui.cursor.visible)
        return;
    if (player.vehicle && player.vehicle.getPedInSeat(-1) === player.handle) {
        vehClass = player.vehicle.getClass();
        if (!isValidVehicle(vehClass))
            return;
        if (cruiseControl) {
            if (vehMaxSpeed - 5 < 0)
                return cruiseControl = false;
            vehMaxSpeedKm -= 5;
            vehMaxSpeed = vehMaxSpeedKm / unitScale;
            showTemporaryNotification(idCruise, `${translationsCruise['cruiseControlReduced']}`, notificationTime);
            if (player.vehicle.getClass() === 16) {
                player.vehicle.setMaxSpeed(vehMaxSpeed);
            }
        }
    }
});
function showTemporaryNotification(id, message, duration) {
    const existingTimeout = notificationTimeouts[id];
    if (existingTimeout !== undefined) {
        clearTimeout(existingTimeout);
    }
    mp.browserCall("hudVM", "dismissMessage", id);
    mp.browserCall("hudVM", "sendMessage", id, message);
    notificationTimeouts[id] = setTimeout(() => {
        mp.browserCall("hudVM", "dismissMessage", id);
        delete notificationTimeouts[id];
    }, duration);
}

}
cruisecontrol.js
{
var player = mp.players.local;
const hookKey = 0x5A; // (Z)
let attachedVehId = null;
mp.game.vehicle.setExperimentalAttachmentSyncEnabled(true);
mp.events.add({
    "entityStreamIn": async (entity) => {
        // check if entity is trailer
        if (entity.type === 'vehicle' && entity.getClass() === 11) {
            entity.setInvincible(true);
        }
    },
    "entityStreamOut": async (entity) => {
        if (entity.type === 'vehicle') {
            if (mp.isTruck(entity.model))
                entity.detachFromTrailer(); // detach trailers when truck is streamed out
            else if (mp.isTowTruck(entity.model)) {
                let vehAttachedHandle = getVehicleAttached(entity);
                let vehAttached = mp.vehicles.atHandle(vehAttachedHandle);
                if (mp.vehicles.exists(vehAttached)) {
                    vehAttached.detachFromAnyTowTruck();
                }
            }
        }
    }
});
mp.events.addDataHandler("attachedTo", (trailer, value, oldValue) => {
    if (value !== oldValue && trailer.handle) {
        if (value === -1) {
            let veh = mp.vehicles.atRemoteId(oldValue);
            if (mp.vehicles.exists(veh) && veh.handle) {
                veh.detachFromTrailer();
            }
        }
        else {
            let veh = mp.vehicles.atRemoteId(value);
            if (mp.vehicles.exists(veh) && veh.handle) {
                veh.attachToTrailer(trailer.handle, 0);
            }
        }
    }
});
mp.useInput(mp.input.HOOK_TRAILER, true, function () {
    let veh = player.vehicle;
    if (veh && veh.getPedInSeat(-1) === player.handle) {
        let targetVeh = getTargetVehicle(veh);
        if (mp.isTowTruck(veh.model) && getVehicleAttached(veh) === 0) {
            if (targetVeh)
                mp.events.originalCallRemote("entity:set_control", targetVeh, player);
        }
        else if (mp.isTruck(veh.model) && !veh.isAttachedToTrailer()) {
            if (targetVeh) {
                mp.events.originalCallRemote("entity:set_control", targetVeh, player);
                veh.attachToTrailer(targetVeh.handle, 10.0);
            }
        }
    }
});
mp.rpc("vehicles:attach_trailer", (vehicleId, trailerId) => {
    let vehicle = mp.vehicles.atRemoteId(vehicleId);
    let attachedTrailer = mp.vehicles.atRemoteId(trailerId);
    if (!mp.vehicles.exists(vehicle))
        return;
    let isTowtruck = mp.isTowTruck(vehicle.model);
    // on attach
    if (mp.vehicles.exists(attachedTrailer)) {
        attachedVehId = attachedTrailer.remoteId;
        mp.events.callRemote("trailer:on_attach", vehicle.remoteId, attachedTrailer.remoteId);
        mp.events.originalCallRemote("entity:set_control", attachedTrailer, player);
        if (!isTowtruck) {
            mp.events.originalCallRemote("vehicles:attached_to", attachedTrailer.remoteId, vehicle.remoteId);
            if (!vehicle.isAttachedToTrailer()) {
                vehicle.attachToTrailer(attachedTrailer.handle, 10.0);
                attachedTrailer.setFixed();
            }
        }
        else {
            // attach to towtruck in event "entityControllerChange"
        }
    }
    else {
        // on detach
        let oldTrailerAttached = vehicle.actualTrailerAttached || 0;
        let oldAttached = mp.vehicles.atHandle(oldTrailerAttached);
        if (mp.vehicles.exists(oldAttached)) {
            // if old trailer controller change, is rage bug, try to re-attach.
            if (oldAttached.controller && oldAttached.controller !== mp.players.local) {
                mp.events.call("vehicles:attach_trailer", mp.players.local.vehicle.remoteId, attachedVehId);
                return;
            }
            mp.events.callRemote("trailer:on_detach", vehicle.remoteId);
            if (!isTowtruck) {
                mp.events.originalCallRemote("vehicles:attached_to", oldAttached.remoteId, -1);
                vehicle.detachFromTrailer();
            }
            else {
                oldAttached.detachFromAnyTowTruck();
            }
            attachedVehId = null;
        }
        else {
            mp.events.callRemote("trailer:on_detach", vehicle.remoteId);
            attachedVehId = null;
        }
    }
    vehicle.actualTrailerAttached = attachedTrailer && attachedTrailer.handle ? attachedTrailer.handle : 0;
});
mp.events.add("entityControllerChange", (entity, newController) => {
    // only check entity controller change for vehicles
    if (attachedVehId && mp.players.local.vehicle && entity.type === "vehicle" && entity.remoteId === attachedVehId && newController === mp.players.local) {
        const vehicle = mp.players.local.vehicle;
        const attachedTrailer = entity;
        if (mp.isTowTruck(vehicle.model)) {
            setTimeout(() => {
                mp.game.invoke("0x29A16F8D621C4508", vehicle.handle, attachedTrailer.handle, false, 0, 0, 0); // ATTACH_VEHICLE_TO_TOW_TRUCK
            }, 1000);
        }
    }
});
// Trailer events
mp.setInterval(() => {
    let v = player.vehicle;
    if (v && v.getPedInSeat(-1) === player.handle) {
        let isTowtruck = mp.isTowTruck(v.model);
        let oldTrailerAttached = v.actualTrailerAttached || 0;
        let actualTrailerAttached = isTowtruck ? getVehicleAttached(v) : getTrailerAttached(v);
        // if trailer attached change
        if (oldTrailerAttached !== actualTrailerAttached) {
            // if new trailer attached is not null
            if (actualTrailerAttached !== 0) {
                let attachedTrailer = mp.vehicles.atHandle(actualTrailerAttached);
                mp.events.call("vehicles:attach_trailer", v.remoteId, attachedTrailer.remoteId);
            }
            else {
                mp.events.call("vehicles:attach_trailer", v.remoteId, -1);
            }
        }
    }
}, 1000);
mp.events.add("render", () => {
    if (mp.players.local.vehicle && mp.isTruck(mp.players.local.vehicle.model)) {
        let speed = player.vehicle.getSpeed();
        if (speed > 10) {
            // disable remove trailer control
            mp.game.controls.disableControlAction(0, 74, true);
        }
    }
});
/** Returns the vehicle handle attached in the given [vehicle] (only for towtrucks) */
function getVehicleAttached(vehicle) {
    return mp.game.invoke("0xEFEA18DCF10F8F75", vehicle.handle); // GET_ENTITY_ATTACHED_TO_TOW_TRUCK(Vehicle towTruck);
}
/** Returns the trailer handle attached from the [vehicle] */
function getTrailerAttached(vehicle) {
    let attachedVehicle = [0];
    mp.game.invoke("0x1CDD6BADC297830D", vehicle.handle, attachedVehicle); // GET_VEHICLE_TRAILER_VEHICLE(Vehicle vehicle, Vehicle* trailer);
    return attachedVehicle[0];
}
function getTargetVehicle(towTruck) {
    let towTruckDimension = mp.game.gameplay.getModelDimensions(towTruck.model);
    // towTruckDimension.min is probably a misspelling?
    let positionFrom = towTruck.getOffsetFromInWorldCoords(0, towTruckDimension.min.y - 0.5, 0);
    let positionTo = towTruck.getOffsetFromInWorldCoords(0, towTruckDimension.min.y - 3, 0);
    let raycast = mp.raycasting.testCapsule(positionFrom, positionTo, 0.5, null, 2);
    if (raycast && raycast.entity && raycast.entity.type === 'vehicle')
        return raycast.entity;
    else
        return null;
}

}
trailersync.js
{
// Script by: https://rage.mp/forums/topic/995-updated-sirens-silencer/
let localPlayerSirens = mp.players.local;
let sirens_translations = {};
let sirenTimeout = null;
mp.rpc("player:set_server_language", (lang) => {
    sirens_translations = mp.getTranslations(['sirensEnabled', 'sirensDisabled'], lang);
});
mp.useInput(mp.input.TOGGLE_SIRENS, true, () => {
    if (mp.gui.cursor.visible)
        return;
    if (localPlayerSirens.vehicle && localPlayerSirens.vehicle.getPedInSeat(-1) === localPlayerSirens.handle && localPlayerSirens.vehicle.getClass() === 18) {
        const id = "sirenSound";
        if (sirenTimeout !== null) {
            clearTimeout(sirenTimeout);
            sirenTimeout = null;
        }
        mp.browserCall("hudVM", "sendMessage", id, localPlayerSirens.vehicle.getVariable('sirenSound')
            ? sirens_translations['sirensEnabled']
            : sirens_translations['sirensDisabled']);
        sirenTimeout = setTimeout(() => {
            mp.browserCall("hudVM", "dismissMessage", id);
            sirenTimeout = null;
        }, 5000);
        mp.events.originalCallRemote('vehicles:sirens_sync', localPlayerSirens.vehicle);
    }
});
mp.events.add('entityStreamIn', (entity) => {
    if (entity.type === 'vehicle' && entity.getClass() === 18 && entity.hasVariable('sirenSound')) {
        entity.setSirenSound(entity.getVariable('sirenSound'));
    }
});
mp.events.addDataHandler("sirenSound", (entity, value) => {
    if (entity.type === "vehicle" && entity.handle)
        entity.setSirenSound(value);
});

}
{
/** Implements most per-player functions. */
let playerControllable = true;
let blackScreenOn = false;
let blackScreenBegin = 0;
let blackScreenTime = 0;
let wantedStars = 0;
let wantedTilting = 0;
let firstSpawn = false;
let canUseMelee = true;
let parachute = null;
let landing = false;
let meleeLock = 0; // if time < this, won't be able to use melee
const inputVehAttackLeft = 346;
const inputVehAttackRight = 347;
let haveMask = false;
const maskNotHaveToFix = [11, 12, 27, 73, 120, 121, 148]; // https://wiki.rage.mp/index.php?title=Masks
let underWaterEffect = false;
let playerWeapon;
let followingPlayer = null;
let walkingToPlayer = false;
let disableVehiclePlayersCollision = false;
let disableVehiclesCollision = false;
let vehicleCollisions = null;
const vehicleClassMotorcycles = 8;
let serverName = "GTAHUB.GG";
let forceFirstPerson = false;
let forceWalking = false;
// localization
let player_translations = {};
//getStatInt  let out = 0;let o2 = mp.game.stats.statGetInt(mp.game.joaat("SP0_FLYING_ABILITY"), out, -1);out;o2;
//setStatInt let out = mp.game.stats.statSetInt(mp.game.joaat("SP0_FLYING_ABILITY"), 100, true);out;
let performance = {}; // create map with player performance
mp.game.player.setRunSprintMultiplierFor(1.0);
mp.game.player.setSwimMultiplierFor(1.0);
mp.game.stats.statSetInt(mp.game.joaat("SP0_FLYING_ABILITY"), 100, true);
mp.game.audio.startAudioScene("DLC_MPHEIST_TRANSITION_TO_APT_FADE_IN_RADIO_SCENE"); // Remove the music from default gta clubs
// disable vehicle damage
mp.game.invoke("0x4757F00BC6323CFE", -1553120962, 0.0); // _SET_WEAPON_DAMAGE_MODIFIER_THIS_FRAME
mp.game.audio.setStaticEmitterEnabled("collision_8wahaxg", false); // remove shopping center ambience sound
mp.game.graphics.setTimecycleModifier("default");
// Ping
mp.rpc("player:ping", (idx) => {
    mp.events.callRemote("player:on_pong", idx);
});
// position
var ChangePositionResult;
// position
(function (ChangePositionResult) {
    ChangePositionResult[ChangePositionResult["INVALID"] = 0] = "INVALID";
    ChangePositionResult[ChangePositionResult["PLAYER_NOT_FOUND"] = 1] = "PLAYER_NOT_FOUND";
    ChangePositionResult[ChangePositionResult["CANCELED"] = 2] = "CANCELED";
    ChangePositionResult[ChangePositionResult["FAILED"] = 3] = "FAILED";
    ChangePositionResult[ChangePositionResult["SUCCESS"] = 4] = "SUCCESS";
})(ChangePositionResult || (ChangePositionResult = {}));
function changePosition(id, pos) {
    let p = mp.players.atRemoteId(id);
    if (!p || p.handle === 0)
        return ChangePositionResult.PLAYER_NOT_FOUND;
    p.setCoords(pos.x, pos.y, pos.z - 1, true, false, false, false);
    mp.events.call("animation:stop", id, false);
    if (p === mp.players.local) {
        mp.events.call("player:set_position_noclip", pos.x, pos.y, pos.z);
    }
    return ChangePositionResult.SUCCESS;
}
mp.rpc("player:set_position", (id, pos) => {
    const result = changePosition(id, pos);
    mp.events.callRemote("player:set_position_result", result);
});
mp.rpc("player:set_angle", (id, angle) => {
    let p = mp.players.atRemoteId(id);
    if (!p || p.handle === 0)
        return;
    if (!p.vehicle)
        p.setHeading(angle);
    else
        p.setDesiredHeading(angle);
});
mp.rpc("player:spawn", (id, position, angle) => {
    let p = mp.players.atRemoteId(id);
    if (!p || p.handle === 0)
        return;
    p.clearBloodDamage();
    p.setHeading(angle);
    p.setPosition(position);
    mp.events.call("animation:stop", id, true);
    mp.toggleRadar(true);
    /** At first spawn, update discord information every 60s */
    if (!firstSpawn && id === mp.players.local.remoteId) {
        setTimeout(() => mp.freezeToLoadWorld(p), 50);
        setInterval(discordUpdate, 60000);
        // load health bar
        mp.events.call("player:set_health", mp.players.local.getHealth());
    }
});
mp.rpc("discord:set_server_name", (name) => {
    serverName = name;
});
// when spawning, freeze player for a few seconds to load the world clientside.
mp.freezeToLoadWorld = (player, time = 3000) => {
    player.freezePosition(true);
    setTimeout(() => {
        player.freezePosition(false);
        if (!firstSpawn) {
            firstSpawn = true;
            setTimeout(() => checkZGround, 500);
        }
    }, time);
};
mp.rpc("player:set_custom_weather", (weather, time) => {
    mp.customWeather = weather.toLowerCase();
    mp.game.gameplay.setWeatherTypeOverTime(weather, time);
    // enable snow if new weather is 'xmas'
    if (mp.customWeather === "xmas") {
        mp.game.invoke(`0x6E9EF3A33C8899F8`, true); // _FORCE_GROUND_SNOW_PASS
        mp.game.invoke(`0x7F06937B0CDCBC1A`, 1.0); // _SET_SNOW_LEVEL
    }
    else {
        mp.game.invoke(`0x6E9EF3A33C8899F8`, false); // _FORCE_GROUND_SNOW_PASS
    }
});
mp.rpc("player:remove_custom_weather", () => {
    mp.customWeather = "";
    mp.events.call("index:set_weather", mp.currentWeather, 0);
});
mp.rpc("player:set_custom_time_cycle", (timeCycle, strength) => {
    mp.game.graphics.setTimecycleModifier(timeCycle);
    mp.game.graphics.setTimecycleModifierStrength(strength);
});
mp.rpc("player:remove_custom_time_cycle", () => {
    mp.game.graphics.clearTimecycleModifier();
});
mp.rpc("player:set_camera_filter", (filter) => {
    if (filter.toLowerCase() != "none") {
        mp.browserCall("effectscreenVM", "init");
    }
    else {
        mp.browserCall("effectscreenVM", "destroy");
    }
});
mp.events.add("entityStreamIn", (entity) => {
    if (entity.handle !== 0 && entity.type === "player") {
        if (entity.getVariable("haveMask")) {
            fixPlayerFace(entity, true); // fix player face
        }
        if (disableVehiclePlayersCollision && mp.vehicles.exists(vehicleCollisions)) {
            vehicleCollisions.setNoCollision(entity.handle, !disableVehiclePlayersCollision);
        }
    }
    else if (entity.handle && entity.type === "vehicle" && disableVehiclesCollision) {
        mp.players.local.setNoCollision(entity.handle, !disableVehiclesCollision);
    }
});
mp.events.addDataHandler("haveMask", (entity, value, oldValue) => {
    if (value !== oldValue && entity.handle) {
        fixPlayerFace(entity, value);
    }
});
/** Face features to avoid bug with masks (true -> fix player face || false -> set normal player face) */
function fixPlayerFace(player, toggle) {
    if (mp.players.exists(player) && player.handle) {
        // if fix player face for all
        if (toggle) {
            player.setFaceFeature(0, -1);
            player.setFaceFeature(1, 1);
            player.setFaceFeature(2, 1);
            player.setFaceFeature(3, 0);
            player.setFaceFeature(4, 0);
            player.setFaceFeature(5, 0);
            player.setFaceFeature(8, 0);
            player.setFaceFeature(9, -1);
            player.setFaceFeature(10, 1);
            player.setFaceFeature(13, -1);
            player.setFaceFeature(14, 0);
            player.setFaceFeature(15, 0);
            player.setFaceFeature(16, 0);
            player.setFaceFeature(17, -1);
            player.setFaceFeature(18, -1);
            player.setFaceFeature(19, -1);
        }
        else {
            // set normal player face server-side one time
            if (player.handle === mp.players.local.handle) {
                mp.events.callRemote("player:update_face_feature");
            }
        }
    }
}
function setMask(toggle) {
    let needToFix, player = mp.players.local;
    if (toggle) {
        let drawableId = player.getDrawableVariation(1); // Get mask
        needToFix = !maskNotHaveToFix.includes(drawableId); // Check if mask need to be fixed
        if (needToFix) {
            mp.events.originalCallRemote("fixFaceFeature", toggle); // Set antibug face
        }
    }
    else {
        mp.events.originalCallRemote("fixFaceFeature", toggle); // Set normal player face
    }
}
function checkZGround() {
    let player = mp.players.local;
    let interiorId = mp.game.interior.getInteriorAtCoords(player.position.x, player.position.y, player.position.z);
    if (player.isFalling() && interiorId === 0) {
        player.freezePosition(true);
        // first try to put in helicopter/airplane
        setTimeout(() => {
            mp.vehicles.forEachInStreamRange(v => {
                if (!mp.vehicles.exists(v) || !v.handle || player.vehicle || v.getPedInSeat(-1) !== 0)
                    return;
                if (v.getClass() === 15 || v.getClass() === 16 || v.model === mp.game.joaat("polmav")) {
                    player.setIntoVehicle(v.handle, -1);
                }
            });
        }, 3000);
        // if player is not in vehicle, set in ground properly
        setTimeout(async () => {
            if (!player.vehicle) {
                let newPos = await getGroundZ_player(player.position);
                player.position = newPos;
                player.freezePosition(false);
            }
            else
                player.freezePosition(false);
        }, 4000);
    }
}
function getGroundZ_player(pos) {
    return new Promise((resolve, reject) => {
        let newZ = 0;
        let interval = setInterval(() => {
            newZ++;
            pos.z = mp.game.gameplay.getGroundZFor3dCoord(pos.x, pos.y, newZ * 750, false, false);
            if (pos.z % 1 !== 0 || newZ >= 5) {
                pos.z += 1;
                clearInterval(interval);
                resolve(pos);
            }
        }, 500);
    });
}
mp.rpc("player:set_server_language", (lang) => {
    player_translations = mp.getTranslations(['richPresence'], lang);
});
function discordUpdate() {
    mp.discord.update(`${player_translations[`richPresence`]}${serverName}`, mp.players.local.name); //
}
// to lock/unlock world doors. Like removeObject, something that
// mutates the map in an irreversible way
let lockedDoors = [];
mp.setInterval(() => {
    let pos = mp.players.local.position;
    for (let door of lockedDoors) {
        const dist = mp.game.system.vdist(door.position.x, door.position.y, door.position.z, pos.x, pos.y, pos.z);
        if (dist < 25) {
            mp.game.object.setStateOfClosestDoorOfType(door.model, door.position.x, door.position.y, door.position.z, door.locked, 0, false);
        }
    }
}, 1500);
mp.rpc("player:set_world_door_locked", (model, pos, locked) => {
    lockedDoors.push({ model: model, position: pos, locked: locked });
});
mp.rpc("player:set_can_use_melee", (toggle) => {
    // add a lock for one sec to prevent accidental melee after using an item
    if (toggle && !canUseMelee) {
        meleeLock = new Date().getTime() + 1500;
    }
    canUseMelee = toggle;
    mp.game.player.setCanDoDriveBy(toggle);
});
mp.rpc("player:set_ragdoll", (id, toggle) => {
    let player = mp.players.atRemoteId(id);
    if (!mp.players.exists(player) || !player.handle)
        return;
    player.ragdoll = toggle;
});
// Controllable/freezed
mp.rpc("player:set_controllable", (id, controllable) => {
    let player = mp.players.atRemoteId(id);
    if (!player || player.handle === 0)
        return;
    player.freezePosition(!controllable);
    if (id === mp.players.local.remoteId) {
        playerControllable = controllable;
    }
});
mp.rpc("player:set_pos_rot_interpolated", (id, posJson, rot, time) => {
    const player = mp.players.atRemoteId(id);
    if (!player || player.handle === 0)
        return;
    player.lerp = {
        fromPos: player.position,
        fromRot: player.getHeading(),
        toPos: JSON.parse(posJson),
        toRot: rot,
        begin: new Date().getTime(),
        time: time,
        interiorID: mp.game.invoke("0x2107BA504071A6BB", player.handle),
        roomID: mp.game.invoke("0x47C2A06D4F5F424B", player.handle) // gets the room in which the player is
    };
});
mp.rpc("player:remove_from_vehicle_smooth", (id) => {
    let p = mp.players.atRemoteId(id);
    if (!p || p.handle === 0)
        return;
    p.taskLeaveAnyVehicle(0, 0);
});
mp.rpc("player:start_screenfx", (effect, time) => {
    mp.game.graphics.startScreenEffect(effect, time, true);
});
mp.rpc("player:fire_screenfx", (effect, time) => {
    mp.game.graphics.startScreenEffect(effect, time, false);
});
mp.rpc("player:stop_screenfx", (effect) => {
    mp.game.graphics.stopScreenEffect(effect);
});
mp.rpc("player:toggle_black_screen", (toggle, time) => {
    /*blackScreenBegin = new Date().getTime();
    blackScreenTime = time + 1; // safe for division by 0
    blackScreenOn = toggle;*/
    mp.browserExecute("blackScreenVM.toggle(" + toggle + "," + time + ")");
});
mp.rpc("player:toggle_loading_screen", (toggle, time, loc, locIcon, advices) => {
    mp.browserExecute("loadingScreenVM.toggle(" + toggle + "," + time + ",'" + loc + "','" + locIcon + "'," + advices + ")");
    mp.events.call("radarmap:minimize");
});
mp.rpc("player:set_wanted_stars", (level) => {
    wantedStars = level;
    mp.players.local.wantedStars = level;
    mp.browserSet("starsVM", "stars", level);
});
mp.rpc('player:set_fines', (fines) => {
    mp.browserSet("starsVM", "ticketInfo", fines);
});
mp.rpc("player:set_wanted_tilting", (level) => {
    wantedTilting = level;
    mp.browserSet("starsVM", "anim", level == 0);
});
mp.rpc("player:set_waypoint", (enable, position) => {
    if (enable) {
        mp.game.ui.setNewWaypoint(position.x, position.y);
    }
});
mp.rpc("player:set_seatbelt", (toggle) => {
    mp.players.local.seatbelt = toggle;
    mp.players.local.setConfigFlag(32, !toggle); // PED_FLAG_CAN_FLY_THRU_WINDSCREEN
});
mp.rpc("player:set_performance", (performanceName, value) => {
    performanceName = performanceName.toLowerCase(); // always set in lowercase
    performance[performanceName] = value;
    switch (performanceName) {
        case "running_speed": {
            mp.game.player.setRunSprintMultiplierFor(value);
            break;
        }
        case "swimming_speed": {
            mp.game.player.setSwimMultiplierFor(value);
            break;
        }
    }
});
mp.rpc("player:toggle_interior", (interiorDataJson, toggle) => {
    try {
        let interiorData = JSON.parse(interiorDataJson);
        if (toggle) {
            if (mp.profiler.enabled)
                mp.console.logInfo(`[${mp.getCurrentTime()}-IPL]: Loading ${interiorData.name} (props: ${interiorData.props.length})`);
            if (interiorData.name !== "")
                mp.game.streaming.requestIpl(interiorData.name);
            if (interiorData.props.length) {
                for (const prop of interiorData.props) {
                    mp.game.interior.enableInteriorProp(interiorData.id, prop.model);
                    if (prop.color > -1)
                        mp.game.invoke("0xC1F1920BAF281317", interiorData.id, prop.model, prop.color);
                }
                mp.game.interior.refreshInterior(interiorData.id);
            }
        }
        else {
            if (mp.profiler.enabled)
                mp.console.logInfo(`[${mp.getCurrentTime()}-IPL]: Unloading ${interiorData.name} (props: ${interiorData.props.length})`);
            if (interiorData.name !== "")
                mp.game.streaming.removeIpl(interiorData.name);
            if (interiorData.props.length) {
                for (const prop of interiorData.props) {
                    mp.game.interior.disableInteriorProp(interiorData.id, prop.model);
                }
                mp.game.interior.refreshInterior(interiorData.id);
            }
        }
    }
    catch (e) {
        mp.console.logWarning(`cant toggle interior ${interiorDataJson} error ${e}`);
    }
});
mp.rpc("player:clean", (id) => {
    let player = mp.players.atRemoteId(id);
    if (!mp.players.exists(player))
        return;
    player.clearBloodDamage();
});
mp.rpc("player:follow_to", (id) => {
    if (id === -1) {
        mp.players.local.clearTasks();
        followingPlayer = null;
        return;
    }
    let playerToFollow = mp.players.atRemoteId(id);
    if (!playerToFollow || !mp.players.exists(playerToFollow))
        return;
    mp.players.local.taskTurnToFace(playerToFollow.handle, -1);
    followingPlayer = playerToFollow;
});
mp.rpc("player:rappel_from_helicopter", (id) => {
    const player = mp.players.atRemoteId(id);
    const rappelStatus = player.getScriptTaskStatus(-275944640);
    if (rappelStatus === 0 || rappelStatus === 1)
        return;
    player.clearTasks();
    player.taskRappelFromHeli(10);
});
mp.rpc("player:set_max_players_streamed", (amount) => {
    mp.players.maxStreamed = amount;
});
mp.rpc("player:set_max_vehicles_streamed", (amount) => {
    mp.vehicles.maxStreamed = amount;
});
mp.rpc("player:set_player_attachments_streamed", (amount) => {
    mp.setMaxPlayerAttachments(amount);
});
mp.rpc("player:set_max_blips_streamed", (amount) => {
    mp.setMaxPlayerBlips(amount);
});
mp.rpc("player:force_first_person", (toggle) => {
    forceFirstPerson = toggle;
});
mp.rpc("player:set_camera_mode", (mode) => {
    mp.game.cam.setFollowPedCamViewMode(mode);
});
mp.rpc("player:force_walking", (toggle) => {
    forceWalking = toggle;
});
mp.rpc('player:set_pause_menu_config', (title, colorString) => {
    const color = JSON.parse(colorString);
    mp.game.gxt.set('PM_PAUSE_HDR', title);
    mp.game.invoke('0xF314CF4F0211894E', 116, color.r, color.g, color.b, color.a); // REPLACE_HUD_COLOUR_WITH_RGBA
});
mp.rpc("hud:prison_conduct", (amount) => {
    mp.browserCall("hudVM", "setConduct", amount);
});
mp.rpc("hud:jailed", (toggle) => {
    mp.browserCall("hudVM", "setJailed", toggle);
});
mp.rpc("hud:jail_time", (amount) => {
    mp.browserCall("hudVM", "setPrisonTimeRem", amount);
});
mp.rpc("hud:jail_reduced_time", (amount) => {
    mp.browserCall("hudVM", "setPrisonTimeSav", amount);
});
mp.rpc("hud:prison_dungeon_time", (amount) => {
    mp.browserCall("hudVM", "setPrisonDungeonTime", amount);
});
mp.rpc("hud:set_prison_dungeon", (toggle) => {
    mp.browserCall("hudVM", "setOnPrisonDungeon", toggle);
});
mp.rpc("hud:show_money", (toggle) => {
    mp.browserSet("hudVM", "showMoney", toggle);
});
mp.events.add("player:toggle_players_vehicle_collisions", (vehicleId, toggle) => {
    let vehicle = mp.vehicles.atRemoteId(vehicleId);
    if (!toggle && mp.vehicles.exists(vehicle)) {
        disableVehiclePlayersCollision = !toggle;
        vehicleCollisions = vehicle;
        mp.players.forEachInStreamRange(p => {
            vehicle.setNoCollision(p.handle, toggle);
        });
    }
    else if (toggle) {
        disableVehiclePlayersCollision = !toggle;
        mp.players.forEachInStreamRange(p => {
            if (mp.vehicles.exists(vehicleCollisions))
                vehicleCollisions.setNoCollision(p.handle, toggle);
        });
        vehicleCollisions = null;
    }
});
mp.events.add("player:toggle_vehicles_collisions", (toggle) => {
    disableVehiclesCollision = !toggle;
    mp.vehicles.forEachInStreamRange(v => {
        mp.players.local.setNoCollision(v.handle, toggle);
    });
});
mp.rpc("player:copy_to_clipboard", (text) => {
    mp.browserCall("hudVM", "copyToClipboard", text);
});
let breathUnderwater = false;
mp.rpc("player:breath_underwater", (value) => {
    breathUnderwater = value;
});
mp.rpc("player:set_max_labels", (max) => {
    mp.setMaxLabels(max < 0 ? 0 : max);
});
mp.rpc("player:set_max_cef_labels", (max) => {
    mp.setMaxCefLabels(max < 0 ? 0 : max);
});
mp.events.add("playerCreateWaypoint", (position) => {
    mp.events.callRemote("player:on_set_waypoint", true, JSON.stringify(position));
});
let wantedLevelIteration = 0;
mp.setInterval(() => {
    if (wantedStars > 0) {
        if (wantedTilting === 0) {
            // enable/disable fake wanted level, but only blue color.
            if (wantedLevelIteration % 4 === 0) {
                mp.game.invoke('0x1454F2448DE30163', wantedStars);
            }
            else {
                mp.game.invoke('0x1454F2448DE30163', 0);
            }
        }
        else {
            // simply set the wanted stars
            mp.game.invoke('0x1454F2448DE30163', wantedStars);
        }
    }
    else {
        mp.game.invoke('0x1454F2448DE30163', 0);
    }
    wantedLevelIteration += 1;
    // check player mask
    if (mp.players.local.getDrawableVariation(1) !== 0 && !haveMask) {
        haveMask = true;
        setMask(haveMask);
    }
    else if (mp.players.local.getDrawableVariation(1) === 0 && haveMask) {
        haveMask = false;
        setMask(haveMask);
    }
    // set player in ragnoll
    mp.players.forEachInStreamRange((p) => {
        if (p.ragdoll) {
            p.setToRagdoll(2000, 2000, 0, false, false, false);
        }
    });
    // underwater effect
    if (mp.players.local.isSwimmingUnderWater()) {
        if (!mp.players.local.isDiving) {
            mp.players.local.isDiving = true;
            mp.events.callRemote("player:on_toggle_diving", mp.players.local.isDiving);
        }
        if (breathUnderwater) {
            mp.game.player.setUnderwaterTimeRemaining(100);
            if (underWaterEffect)
                underWaterEffect = !mp.game.graphics.transitionFromBlurred(7500);
        }
        let oxygen = mp.game.player.getUnderwaterTimeRemaining();
        if (oxygen <= 10 && !breathUnderwater) {
            if (underWaterEffect)
                return;
            mp.game.graphics.startScreenEffect('ArenaEMPOut', 4500, false);
            underWaterEffect = mp.game.graphics.transitionToBlurred(3500);
        }
    }
    else {
        if (mp.players.local.isDiving) {
            mp.players.local.isDiving = false;
            mp.events.callRemote("player:on_toggle_diving", mp.players.local.isDiving);
        }
        if (underWaterEffect) {
            underWaterEffect = !mp.game.graphics.transitionFromBlurred(7500);
        }
    }
    // following player
    if (mp.players.exists(followingPlayer) && followingPlayer.handle) {
        let localPosition = mp.players.local.position;
        if (mp.game.system.vdist(localPosition.x, localPosition.y, localPosition.z, followingPlayer.position.x, followingPlayer.position.y, followingPlayer.position.z) > 1) {
            if (!mp.players.local.isFacingPed(followingPlayer.handle, 20)) {
                mp.players.local.taskTurnToFace(followingPlayer.handle, -1);
                walkingToPlayer = false;
            }
            else {
                if (!walkingToPlayer) {
                    walkingToPlayer = true;
                    mp.players.local.taskPlayAnim("mp_arresting", "walk", 4.0, 4.0, -1, 1, 0, false, false, false);
                }
            }
        }
        else {
            walkingToPlayer = false;
            mp.players.local.clearTasks();
        }
    }
}, 400);
mp.events.add("render", () => {
    let time = new Date().getTime();
    // disable vehicle damage
    mp.game.invoke("0x4757F00BC6323CFE", -1553120962, 0.0); // _SET_WEAPON_DAMAGE_MODIFIER_THIS_FRAME
    mp.game.ui.hideHudComponentThisFrame(1); // wanted stars
    mp.game.ui.hideHudComponentThisFrame(6); // vehicle name
    mp.game.ui.hideHudComponentThisFrame(7); // area name
    mp.game.ui.hideHudComponentThisFrame(8); // vehicle class
    mp.game.ui.hideHudComponentThisFrame(9); // street names
    // disable controls while !controllable
    if (!playerControllable) {
        mp.game.controls.disableAllControlActions(0); // INPUTGROUP_MOVE
        mp.game.controls.disableAllControlActions(27); // INPUTGROUP_VEH_MOVE_ALL
        mp.game.controls.disableAllControlActions(31); // INPUTGROUP_VEH_HYDRAULICS_CONTROL
        if (mp.players.local.vehicle) {
            mp.game.controls.setControlNormal(27, 76, 1); // hold HANDBRAKE
        }
        // enable voice, as it's disabled with all those controls
        mp.game.controls.enableControlAction(0, 249, true);
        mp.game.controls.enableControlAction(1, 199, true);
        mp.game.controls.enableControlAction(1, 200, true);
    }
    // black screen check
    if (blackScreenOn) {
        let t = (time - blackScreenBegin) / blackScreenTime;
        if (t > 1)
            t = 1;
        mp.game.graphics.drawRect(0, 0, 10, 10, 0, 0, 0, Math.round(t * 255));
    }
    else {
        if (time < blackScreenBegin + blackScreenTime) {
            let t = (time - blackScreenBegin) / blackScreenTime;
            if (t > 1)
                t = 1;
            mp.game.graphics.drawRect(0, 0, 10, 10, 0, 0, 0, Math.round((1 - t) * 255));
        }
    }
    // infinite stamina for avoid client bug, running and in cycles.
    if ((mp.players.local.isRunning()) ||
        (mp.players.local.vehicle && mp.players.local.vehicle.handle !== 0 && mp.players.local.vehicle.getClass() === 13)) {
        mp.game.player.restoreStamina(100);
    }
    // process lerp
    mp.players.forEachInStreamRange((p) => {
        if (!mp.players.exists(p) || !p.handle)
            return;
        if (p.lerp) {
            let playerRoom = mp.game.invoke("0x47C2A06D4F5F424B", mp.players.local.handle); // gets the room in which the player is
            let playerInterior = mp.game.invoke("0x2107BA504071A6BB", mp.players.local.handle); // gets the interior in which the player is
            let l = p.lerp;
            let off = (time - l.begin) / l.time;
            if (off >= 1) {
                p.setCoords(l.toPos.x, l.toPos.y, l.toPos.z - 1, true, true, true, true);
                if (!p.vehicle)
                    p.setHeading(l.toRot);
                else
                    p.setDesiredHeading(l.toRot);
                if (p.lerp.interiorID !== playerInterior && p.lerp.roomID !== playerRoom) {
                    mp.game.invoke("0x52923C4710DD9907", p.handle, p.lerp.interiorID, p.lerp.roomID);
                }
                delete p.lerp;
            }
            else {
                let newPos = mp.lerpVector(l.fromPos, l.toPos, off);
                p.setCoords(newPos.x, newPos.y, newPos.z - 1, true, true, true, true);
                if (!p.vehicle)
                    p.setHeading(mp.angleLerp(l.fromRot, l.toRot, off));
                else
                    p.setDesiredHeading(mp.angleLerp(l.fromRot, l.toRot, off));
                if (p.lerp.interiorID !== playerInterior && p.lerp.roomID !== playerRoom) {
                    mp.game.invoke("0x52923C4710DD9907", p.handle, p.lerp.interiorID, p.lerp.roomID);
                }
            }
        }
        // flashlight sync
        if (p !== mp.players.local && p.weapon === 2343591895 && p.getConfigFlag(78, true)) {
            let from = p.getBoneCoords(57005, 0.11, 0.0, 0.0);
            if (from) {
                let to = p.getForwardVector();
                if (to) {
                    mp.game.graphics.drawSpotLight(from.x, from.y, from.z, to.x, to.y, to.z, 255, 255, 240, 20, 5, 5, 15, 5);
                }
            }
        }
        // parachute sync
        /*
        if (p !== mp.players.local && p.getParachuteState() === 2) {
            p.taskParachute(true);
            let pos = p.getCoords(true);
            pos.z = pos.z + 2;
            if (!parachute) {
                parachute = mp.objects.new(mp.game.joaat("p_parachute1_mp_s"), pos, {
                    rotation: p.getRotation(5),
                    alpha: 255,
                    dimension: p.dimension
                });
                parachute.setCollision(false, false);
                mp.players.local.setNoCollision(parachute.handle, false);
            } else if (mp.objects.exists(parachute)) {
                parachute.setCoords(pos.x, pos.y, pos.z, true, false, false, false);
            }
        } else if (mp.objects.exists(parachute)) {
            parachute.destroy();
            parachute = null;
        }*/
    });
    if (!landing && mp.players.local.getParachuteState() === 1) {
        landing = true;
        mp.events.callRemote("pa:on_open_parachute");
    }
    else if (landing && mp.players.local.getParachuteLandingType() !== -1) {
        landing = false;
        mp.events.callRemote("pa:on_remove_parachute");
    }
    // sync players in interiors
    let playerRoom = mp.game.invoke("0x47C2A06D4F5F424B", mp.players.local.handle); // gets the room in which the player is
    let playerInterior = mp.game.invoke("0x2107BA504071A6BB", mp.players.local.handle); // gets the interior in which the player is
    if (playerInterior > 0 && playerRoom > 0) {
        mp.players.forEachInRange(mp.players.local.position, 15, (streamedPlayer) => {
            if (streamedPlayer !== mp.players.local) {
                let targetRoom = mp.game.invoke("0x47C2A06D4F5F424B", streamedPlayer.handle);
                let targetInterior = mp.game.invoke("0x2107BA504071A6BB", streamedPlayer.handle);
                if (playerRoom !== targetRoom || playerInterior !== targetInterior) {
                    mp.game.invoke("0x52923C4710DD9907", streamedPlayer.handle, playerInterior, playerRoom); // forces the same room and id on the target
                }
            }
        });
    }
    /* i miss u :c
    if (mp.players.local.dimension > 100000 && mp.players.local.position.z >= 0) {
        if (!npcsEnabled) {
            mp.game.streaming.setPedPopulationBudget(3);
            mp.game.streaming.setVehiclePopulationBudget(3);
        }
        npcsEnabled = true;
    } else if (npcsEnabled) {
        mp.game.streaming.setPedPopulationBudget(0);
        mp.game.streaming.setVehiclePopulationBudget(0);
        let pos = mp.players.local.position;
        mp.game.gameplay.clearAreaOfVehicles(pos.x, pos.y, pos.z, 500, false, false, false, false, false);
        mp.game.gameplay.clearAreaOfPeds(pos.x, pos.y, pos.z, 500, 1);
        npcsEnabled = false;
    }*/
    // force first person
    if (forceFirstPerson && mp.game.invoke("0x8D4D46230B2C353A") != 4) {
        mp.game.cam.setFollowPedCamViewMode(4);
    }
    if (forceWalking) {
        mp.game.controls.disableControlAction(0, 22, true);
        mp.game.controls.disableControlAction(0, 21, true);
    }
});
// Disable melee in an interval instead of render because render is paused when RAGE menu is open
setInterval(() => {
    let time = new Date().getTime();
    let v = mp.players.local.vehicle;
    if (v) {
        let vClass = mp.game.vehicle.getVehicleClass(v.handle);
        if (vClass === vehicleClassMotorcycles) {
            mp.game.controls.disableControlAction(0, inputVehAttackLeft, true);
            mp.game.controls.disableControlAction(0, inputVehAttackRight, true);
        }
    }
    if (!canUseMelee || meleeLock > time) {
        mp.game.controls.disableControlAction(0, 24, true); // fire
        mp.game.controls.disableControlAction(0, 25, true); // aim
        mp.game.controls.disableControlAction(0, 50, true); // aim zoom
        mp.game.controls.disableControlAction(0, 140, true); // melee light
        mp.game.controls.disableControlAction(0, 141, true); // melee heavy
        mp.game.controls.disableControlAction(0, 142, true); // INPUT_MELEE_ATTACK_ALTERNATE
        mp.game.controls.disableControlAction(0, 143, true); // INPUT_MELEE_BLOCK
        mp.game.controls.disableControlAction(0, 263, true); // INPUT_MELEE_ATTACK_LIGHT
        mp.game.controls.disableControlAction(0, 264, true); // INPUT_MELEE_ATTACK_HEAVY
        mp.game.controls.disableControlAction(0, 257, true); // INPUT_ATTACK2
    }
}, 0);
setInterval(() => {
    mp.game.audio.setAmbientZoneListStatePersistent("AZL_DLC_Hei4_Island_Disabled_Zones", false, true);
    mp.game.audio.setAmbientZoneListStatePersistent("AZL_DLC_Hei4_Island_Zones", true, true);
    mp.game.audio.setAudioFlag("DisableFlightMusic", true);
    mp.game.audio.setAudioFlag("PoliceScannerDisabled", true);
    mp.game.audio.setFlag("LoadMPData", true);
    mp.game.audio.setFlag("DisableFlightMusic", true);
    mp.game.water.setDeepOceanScaler(0.0);
    mp.game.misc.setRandomEventFlag(false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_BIKE_OFF_ROAD_RACE", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_BUSINESSMEN", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_EMPTY", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_MECHANIC", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_MILITARY_PLANES_BIG", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_MILITARY_PLANES_SMALL", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_POLICE_BIKE", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_POLICE_CAR", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_POLICE_NEXT_TO_CAR", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_SALTON_DIRT_BIKE", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_SALTON", false);
    mp.game.task.setScenarioTypeEnabled("WORLD_VEHICLE_STREETRACE", false);
    mp.game.audio.setStaticEmitterEnabled("LOS_SANTOS_VANILLA_UNICORN_01_STAGE", false);
    mp.game.audio.setStaticEmitterEnabled("LOS_SANTOS_VANILLA_UNICORN_02_MAIN_ROOM", false);
    mp.game.audio.setStaticEmitterEnabled("LOS_SANTOS_VANILLA_UNICORN_03_BACK_ROOM", false);
    mp.game.audio.setStaticEmitterEnabled("se_dlc_aw_arena_construction_01", false);
    mp.game.audio.setStaticEmitterEnabled("se_dlc_aw_arena_crowd_background_main", false);
    mp.game.audio.setStaticEmitterEnabled("se_dlc_aw_arena_crowd_exterior_lobby", false);
    mp.game.audio.setStaticEmitterEnabled("se_dlc_aw_arena_crowd_interior_lobby", false);
    mp.game.audio.startAudioScene("CHARACTER_CHANGE_IN_SKY_SCENE");
    mp.game.audio.startAudioScene("DLC_MPHEIST_TRANSITION_TO_APT_FADE_IN_RADIO_SCENE");
    mp.game.audio.startAudioScene("FBI_HEIST_H5_MUTE_AMBIENCE_SCENE");
    mp.players.local.setConfigFlag(35, false); //PED_FLAG_CAN_PUT_MOTORCYCLE_HELMET == FALSE
    mp.game.player.setAutoGiveParachuteWhenEnterPlane(false);
}, 1000);
const chunkedDataStates = new Map();
// Clean up stale chunked data states every minute
setInterval(() => {
    const now = new Date().getTime();
    const timeoutMs = 60000; // 1 minute timeout
    for (const [name, state] of chunkedDataStates.entries()) {
        if (now - state.lastChunkTime > timeoutMs) {
            console.warn(`Cleaning up stale chunked data state: ${name}`);
            chunkedDataStates.delete(name);
        }
    }
}, 60000); // Check every minute
mp.rpc("player:call_chunked", (name, bigObject) => {
    if (bigObject.startsWith("~~~")) {
        // Start building a new chunked object
        const state = {
            name: name,
            chunks: [
                bigObject.slice(3) // Remove the starting ~~~
            ],
            isComplete: false,
            lastChunkTime: new Date().getTime()
        };
        chunkedDataStates.set(name, state);
        return;
    }
    // Check if this is the end of a chunked object
    if (bigObject.endsWith("~~~")) {
        const state = chunkedDataStates.get(name);
        if (state) {
            // Add the final chunk (without the ending ~~~)
            const finalChunk = bigObject.slice(0, -3);
            if (finalChunk) {
                state.chunks.push(finalChunk);
            }
            // Update the last chunk time
            state.lastChunkTime = new Date().getTime();
            // Reconstruct the complete object
            const completeData = state.chunks.join("");
            try {
                mp.events.call(name, completeData);
                chunkedDataStates.delete(name);
            }
            catch (error) {
                console.error(`Error parsing chunked data for event ${name}:`, error);
                chunkedDataStates.delete(name);
            }
        }
        return;
    }
    // This is a middle chunk, add it to the state
    const state = chunkedDataStates.get(name);
    if (state) {
        state.chunks.push(bigObject);
        state.lastChunkTime = new Date().getTime();
    }
});
mp.rpc("player:disable_collision", (targetPlayer, timeout) => {
    let player = mp.players.atRemoteId(targetPlayer);
    if (!mp.players.exists(player) || !player.handle)
        return;
    player.setNoCollision(mp.players.local.handle, true);
    setTimeout(() => {
        if (mp.players.exists(player) && player.handle) {
            player.setNoCollision(mp.players.local.handle, false);
        }
    }, timeout);
});
mp.rpc("player:enable_collision", (targetPlayer) => {
    let player = mp.players.atRemoteId(targetPlayer);
    if (!mp.players.exists(player) || !player.handle)
        return;
    player.setNoCollision(mp.players.local.handle, false);
});
mp.rpc("player:test_ragearray", (a) => {
    mp.console.logInfo(`array: ${JSON.stringify(a)}`);
});

}
{
System.register(["./ui_interface_manager"], function (exports_1, context_1) {
    "use strict";
    var ui_interface_manager_1, hud_translations, numberKeys, animShortcutKey, hasItems, previewPed, playerClothes, playerProps, talkingModeIcons, hideShortInfoInterval, hideLongInfoInterval, hideSpecialInfoInterval, lastPlayerinvPress;
    var __moduleName = context_1 && context_1.id;
    function bindKeyToNumber(number, keyCode) {
        // TODO we can actually map the hotbar so user can change the keys
        mp.keys.bind(keyCode, true, function () {
            try {
                if (!mp.gui.cursor.visible && !mp.keys.isDown(animShortcutKey)) {
                    onNumberPress(number);
                }
            }
            catch (e) {
                mp.console.logError(`Error on number select ${number}: ${e}`);
            }
        });
    }
    function onNumberPress(num) {
        let resultNum = parseInt(num);
        if (resultNum == 0)
            resultNum = 12;
        resultNum = resultNum - 1;
        mp.events.callRemote("hotbar:on_select_index", resultNum);
    }
    function setDateTime() {
        const date = new Date();
        let dateOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'UTC'
        };
        let timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
            timeZone: 'UTC'
        };
        const dateFormat = new Intl.DateTimeFormat(hud_translations['format'], dateOptions);
        const timeFormat = new Intl.DateTimeFormat(hud_translations['format'], timeOptions);
        const dateStr = dateFormat.format(date);
        const time = timeFormat.format(date);
        mp.browserSet("hudVM", "date", dateStr);
        mp.browserSet("hudVM", "time", time);
        setTimeout(setDateTime, 1000);
    }
    async function toggleInventory(toggle) {
        if (toggle) {
            if (mp.isUIEnabled("dialog")) {
                mp.events.call("dialog:force_close");
            }
            if (!ui_interface_manager_1.uiManager.prepareOpen("playerinv", { forceCloseActive: true })) {
                return;
            }
        }
        else {
            ui_interface_manager_1.uiManager.onClose("playerinv");
        }
        togglePedScreen(toggle);
    }
    async function togglePedScreen(toggle) {
        if (toggle) {
            updatePlayerDrawables();
            mp.game.ui.setFrontendActive(true);
            mp.game.ui.activateFrontendMenu(mp.game.joaat("FE_MENU_VERSION_CORONA_INVITE_CREWS"), false, -1);
            await waitFrontend();
            let pos = mp.players.local.position;
            previewPed = mp.players.local.clone(mp.players.local.getHeading(), false, true);
            mp.game.invoke("0x06843DA7060A026B", previewPed, pos.x, pos.y, pos.z - 15, false, false, false, true);
            mp.game.invoke("0x428CA6DBD1094446", previewPed, true);
            setTimeout(() => mp.game.invoke("0xAC0BFBDC3BE00E14", previewPed, 0), 100); // GIVE_PED_TO_PAUSE_MENU with 100ms delay
            mp.game.invoke("0xECF128344E9FF9F1", false); // SET_PAUSE_MENU_PED_SLEEP_STATE
            mp.game.invoke("0x3CA6050692BC61B0", false); // SET_PAUSE_MENU_PED_LIGHTING
            mp.game.invoke("0x98215325A695E78A", false); // MOUSE
            setTimeout(() => {
                mp.game.invoke("0xECF128344E9FF9F1", true); // SET_PAUSE_MENU_PED_SLEEP_STATE
                mp.game.invoke("0x3CA6050692BC61B0", true); // SET_PAUSE_MENU_PED_LIGHTING
            }, 1000);
            mp.toggleHud(true);
            let gender = mp.players.local.model === mp.game.joaat('mp_f_freemode_01') ? 'f' : 'm';
            mp.browserSet("playerinvVM", "gender", gender);
        }
        else {
            mp.game.invoke("0x5E62BE5DC58E9E06"); // CLEAR_PED_IN_PAUSE_MENU
            mp.game.ui.setFrontendActive(false);
            previewPed = null;
        }
    }
    function updatePedScreen() {
        updatePlayerDrawables();
        mp.game.invoke("0x5E62BE5DC58E9E06"); // CLEAR_PED_IN_PAUSE_MENU
        previewPed = mp.players.local.clone(mp.players.local.getHeading(), false, true);
        let pos = mp.players.local.position;
        mp.game.invoke("0x06843DA7060A026B", previewPed, pos.x, pos.y, pos.z - 15, false, false, false, true);
        mp.game.invoke("0x428CA6DBD1094446", previewPed, true);
        setTimeout(() => mp.game.invoke("0xAC0BFBDC3BE00E14", previewPed, 0), 100); // GIVE_PED_TO_PAUSE_MENU with 100ms delay
    }
    function updatePlayerDrawables() {
        for (let x = 0; x < 11; x++) {
            playerClothes[x] = mp.players.local.getDrawableVariation(x);
            playerProps[x] = mp.players.local.getPropIndex(x);
        }
    }
    async function waitFrontend() {
        const isReady = (resolve) => {
            if (mp.game.invoke("0x3BAB9A4E4F2FF5C7"))
                resolve();
            else
                setTimeout(() => isReady(resolve), 100);
        };
        return new Promise(isReady);
    }
    async function chooseStatsDesign() {
        const canUseAlternativeDesign = await mp.featureFlag.isEnabledGlobally('NEW_DESIGN_NEEDS');
        mp.browserSet("hudVM", "needsAlter", canUseAlternativeDesign);
    }
    return {
        setters: [
            function (ui_interface_manager_1_1) {
                ui_interface_manager_1 = ui_interface_manager_1_1;
            }
        ],
        execute: function () {
            hud_translations = {};
            // listen for numpad and keyboard numbers
            numberKeys = {
                0: [0x30, 0x60],
                1: [0x31, 0x61],
                2: [0x32, 0x62],
                3: [0x33, 0x63],
                4: [0x34, 0x64],
                5: [0x35, 0x65],
                6: [0x36, 0x66],
                7: [0x37, 0x67],
                8: [0x38, 0x68],
            };
            for (let num in numberKeys) {
                let keyCodes = numberKeys[num];
                for (let i = 0; i < keyCodes.length; i++) {
                    bindKeyToNumber(num, keyCodes[i]);
                }
            }
            animShortcutKey = 0x12; // if pressing this, object should not be selected.
            hasItems = false;
            playerClothes = {};
            playerProps = {};
            // remove ped and frontend UI if the server restarts when player has inventory opened
            mp.game.invoke("0x5E62BE5DC58E9E06"); // CLEAR_PED_IN_PAUSE_MENU
            mp.game.ui.setFrontendActive(false);
            previewPed = null;
            talkingModeIcons = {
                "normal": "fa-microphone",
                "low": "fa-microphone-alt",
                "shout": "fa-bullhorn",
                "radio": "fa-rss-square",
                "megaphone": "fa-megaphone",
            };
            hideShortInfoInterval = null;
            hideLongInfoInterval = null;
            hideSpecialInfoInterval = null;
            lastPlayerinvPress = 0;
            mp.rpc("player:set_server_language", (lang) => {
                hud_translations = mp.getTranslations(['format'], lang);
                setDateTime();
            });
            mp.events.add("ui:on_toggle_radar", (toggle) => {
                mp.browserSet("hudVM", "showMapUi", toggle);
            });
            mp.rpc("hud:name", (value) => {
                mp.browserSet("hudVM", "name", value);
            });
            mp.rpc("hud:visualId", (value) => {
                mp.browserSet("hudVM", "visualId", value);
            });
            chooseStatsDesign();
            mp.rpc("hud:health", (health) => {
                mp.browserCall("hudVM", "setHealth", health);
            });
            mp.rpc("hud:armour", (armour) => {
                mp.players.local.setArmour(Math.round(armour * 100));
                mp.browserCall("hudVM", "setArmour", Math.round(armour * 100));
            });
            mp.rpc("hud:food", (value) => {
                mp.browserCall("hudVM", "setFood", value);
            });
            mp.rpc("hud:water", (value) => {
                mp.browserCall("hudVM", "setWater", value);
            });
            mp.rpc("hud:energy", (value) => {
                mp.browserCall("hudVM", "setEnergy", value);
            });
            mp.rpc("hud:money", (amount) => {
                mp.browserCall("hudVM", "setWallet", amount);
            });
            mp.rpc("hud:bank", (amount) => {
                mp.browserCall("hudVM", "setBank", amount);
            });
            mp.rpc("hud:listening", (name) => {
                mp.browserExecute("hudVM.listeningName = " + JSON.stringify(name));
            });
            mp.rpc("hud:is_talking", (is_talking) => {
                mp.browserExecute("hudVM.talking = " + is_talking);
            });
            mp.rpc("hud:short_info", (info, time) => {
                mp.browserSet("hudVM", "shortMessage", info);
                if (hideShortInfoInterval) {
                    clearTimeout(hideShortInfoInterval);
                }
                hideShortInfoInterval = setTimeout(() => {
                    mp.browserSet("hudVM", "shortMessage", "");
                    hideShortInfoInterval = null;
                }, time);
            });
            mp.rpc("hud:long_info", (info, time) => {
                mp.browserSet("hudVM", "longMessage", info);
                if (hideLongInfoInterval) {
                    clearTimeout(hideLongInfoInterval);
                }
                hideLongInfoInterval = setTimeout(() => {
                    mp.browserSet("hudVM", "longMessage", "");
                    hideLongInfoInterval = null;
                }, time);
            });
            mp.rpc("hud:special_info", (info, time) => {
                mp.browserSet("hudVM", "specialMessage", info);
                if (hideSpecialInfoInterval) {
                    clearTimeout(hideSpecialInfoInterval);
                }
                hideSpecialInfoInterval = setTimeout(() => {
                    mp.browserSet("hudVM", "specialMessage", "");
                    hideSpecialInfoInterval = null;
                }, time);
            });
            mp.rpc("hud:talk_mode", (icon, name) => {
                // show the talking name for a few seconds
                let faIcon = talkingModeIcons[icon] || "microphone";
                mp.browserCall("hudVM", "setTalkMode", faIcon, name);
            });
            mp.rpc("hotbar:toggle", (toggle) => {
                mp.browserSet("hudVM", "show", toggle);
            });
            mp.rpc("hud:message", (message, time, id, color) => {
                mp.browserCall("hudVM", "sendMessage", id, message, color);
                setTimeout(() => {
                    mp.browserCall("hudVM", "dismissMessage", id);
                }, time);
            });
            mp.rpc("hud:active_speakers", (speakers) => {
                mp.browserSet("hudVM", "activeSpeakers", JSON.parse(speakers));
            });
            mp.rpc("hud:set_scale", (index) => {
                mp.browserExecute("speedometerVM.setScale(" + index + ")");
                mp.browserExecute("hudVM.setScale(" + index + ")");
                mp.browserExecute("notificationsVM.setScale(" + index + ")");
            });
            mp.rpc("hud:set_scale_factor", (factor) => {
                let factorFixed = factor.toFixed(1);
                mp.browserExecute("hudVM.setScaleFactor(" + factorFixed + ")");
                mp.browserExecute("casinoVM.setScaleFactor(" + factorFixed + ")");
            });
            /*
            mp.useInput(0x49, true, () => { // 'i' key
                if ((mp.isAnyUIEnabled() && mp.getTopUI() !== "playerinv") || mp.gui.cursor.visible || !hasItems) return;
                let now = new Date().getTime();
                if (now - lastPlayerinvPress < 400) {
                    return;
                }
                lastPlayerinvPress = now;
            
                toggleInventory(!mp.isUIEnabled("playerinv"));
            }); */
            /** Closes on esc */
            mp.useInput(mp.input.CLOSE, false, () => {
                let now = new Date().getTime();
                if (now - lastPlayerinvPress < 400) {
                    return;
                }
                /*if (mp.isUIEnabled("playerinv")) {
                    toggleInventory(false);
                }*/
            });
            mp.events.add("hud:toggle_ped_screen", async (toggle) => {
                toggleInventory(toggle);
            });
            mp.setInterval(() => {
                if (previewPed) {
                    for (let x = 0; x < 11; x++) {
                        if (mp.players.local.getDrawableVariation(x) !== playerClothes[x]) {
                            updatePedScreen();
                        }
                        else if (mp.players.local.getPropIndex(x) !== playerProps[x]) {
                            updatePedScreen();
                        }
                    }
                }
            }, 250);
            mp.events.add("playerinv:on_close", () => {
                toggleInventory(false);
                ui_interface_manager_1.uiManager.onClose("playerinv");
            });
        }
    };
});

}
{
mp.noClip = {
    enabled: false,
    anyEntitySelected: false, // if selecting an entity
};
var getNormalizedVector = function (vector) {
    var mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    vector.x = vector.x / mag;
    vector.y = vector.y / mag;
    vector.z = vector.z / mag;
    return vector;
};
var getCrossProduct = function (v1, v2) {
    var vector = new mp.Vector3(0, 0, 0);
    vector.x = v1.y * v2.z - v1.z * v2.y;
    vector.y = v1.z * v2.x - v1.x * v2.z;
    vector.z = v1.x * v2.y - v1.y * v2.x;
    return vector;
};
const bindASCIIKeys = {
    Q: 81,
    LCtrl: 17,
    Shift: 16
};
let isNoClip = false;
let noClipCamera = null;
let shiftModifier = false;
let controlModifier = false;
let localPlayer = mp.players.local;
let fastAccumulative = 0;
let centerPoint = null;
let maxRadius = 0.0;
const velocities = [0.1, 0.25, 0.5, 1, 2, 4, 8, 16];
let currentVelocity = 0; // start at the middle
mp.rpc("player:toggle_noclip", (toggle, centerString, radius) => {
    isNoClip = toggle;
    centerPoint = JSON.parse(centerString);
    maxRadius = radius;
    if (isNoClip) {
        startNoClip();
    }
    else {
        stopNoClip();
    }
    mp.noClip.enabled = toggle;
    mp.noClip.anyEntitySelected = false;
});
mp.events.add("player:set_position_noclip", (x, y, z) => {
    if (isNoClip && noClipCamera) {
        noClipCamera.setCoord(x, y, z);
    }
});
function startNoClip() {
    let camPos = new mp.Vector3(localPlayer.position.x, localPlayer.position.y, localPlayer.position.z);
    let camRot = mp.game.cam.getGameplayCamRot(2);
    noClipCamera = mp.cameras.new('default', camPos, camRot, 45);
    noClipCamera.setActive(true);
    localPlayer.activeCamera = noClipCamera;
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    localPlayer.freezePosition(true);
    localPlayer.setInvincible(true);
    localPlayer.setVisible(false, false);
    localPlayer.setCollision(false, false);
}
function stopNoClip() {
    if (noClipCamera) {
        let noclipCoords = noClipCamera.getCoord();
        localPlayer.setCoords(noclipCoords.x, noclipCoords.y, noclipCoords.z, true, false, false, false);
        localPlayer.setHeading(noClipCamera.getRot(2).z);
        noClipCamera.destroy(true);
        noClipCamera = null;
    }
    mp.game.cam.renderScriptCams(false, false, 0, true, false);
    localPlayer.freezePosition(false);
    localPlayer.activeCamera = null;
    localPlayer.setInvincible(false);
    localPlayer.setVisible(true, false);
    localPlayer.setCollision(true, false);
}
/** Perform logic to select entities */
function doSelectionLogic() {
    let position = noClipCamera.getCoord(); // grab the position of the gameplay camera as Vector3
    let direction = noClipCamera.getDirection(); // get the forwarding vector of the direction you aim with the gameplay camera as Vector3
    const distance = 50; // max distance to select entity
    let crosshairLong = 0.02;
    let crosshairShort = 0.002;
    // Detect target entity.
    // calculate a random point, drawn on a invisible line between camera position and direction (* distance)
    let entity = null;
    let farAway = new mp.Vector3((direction.x * distance) + (position.x), (direction.y * distance) + (position.y), ((direction.z * distance) + (position.z)));
    let raycast = mp.raycasting.testPointToPoint(position, farAway, mp.players.local.handle, -1); // vehicles(2)+peds(4)+peds(8)+objects(16) = 30
    // when raycasting actors rage doesn't return the entity, instead returns the handle.
    if (raycast && raycast.entity && typeof raycast.entity === "number") {
        entity = mp.peds.atHandle(raycast.entity);
    }
    else if (raycast) {
        entity = raycast.entity;
    }
    // try to get from label
    if (mp.labels.selectedLabel) {
        if (!entity) {
            entity = mp.labels.selectedLabel; // set label as selected
        }
        else {
            // entity AND label selected. pick the nearest to the camera
            let label = mp.labels.selectedLabel;
            let distanceToLabel = mp.game.system.vdist2(label.position.x, label.position.y, label.position.z, position.x, position.y, position.z);
            let distanceToObj = mp.game.system.vdist2(entity.position.x, entity.position.y, entity.position.z, position.x, position.y, position.z);
            // pick label only if is nearest to target in distance
            if (distanceToLabel < distanceToObj) {
                entity = label;
            }
        }
    }
    mp.noClip.anyEntitySelected = !!entity;
    if (entity) {
        entity.kind = mp.getEntityKind(entity.type);
        let remoteId = mp.getEntityRemoteId(entity);
        // dispatch event on click
        if (mp.game.controls.isControlJustPressed(28, 237)) {
            mp.events.callRemote("player:on_select_entity", true, entity.kind, remoteId);
        }
        else if (mp.game.controls.isControlJustPressed(28, 238)) {
            mp.events.callRemote("player:on_select_entity", false, entity.kind, remoteId);
        }
        let color;
        switch (entity.type) {
            case "player":
                color = [239, 83, 80];
                break; // red
            case "vehicle":
                color = [102, 187, 106];
                break; // green
            case "object":
                color = [63, 81, 181];
                break; // blue
            case "marker":
                color = [10, 255, 80];
                break; // ?
            case "label":
                color = [255, 167, 38];
                break; // yellow
            case "ped":
                color = [239, 83, 80];
                break; // red
            default:
                color = [15, 15, 15];
                break;
        }
        mp.game.graphics.drawRect(0.5, 0.5, crosshairShort, crosshairLong * 1.2, color[0], color[1], color[2], 255); // semi-transparent
        mp.game.graphics.drawRect(0.5, 0.5, crosshairLong, crosshairShort * 1.2, color[0], color[1], color[2], 255); // semi-transparent
    }
    else {
        // draw a white point
        mp.game.graphics.drawRect(0.5, 0.5, crosshairShort * 0.8, crosshairLong, 180, 180, 180, 255); // semi-transparent
        mp.game.graphics.drawRect(0.5, 0.5, crosshairLong * 0.8, crosshairShort, 180, 180, 180, 255); // semi-transparent
    }
}
mp.events.add('render', function () {
    if (!noClipCamera || mp.gui.cursor.visible) {
        return;
    }
    if (mp.players.local.duty) {
        doSelectionLogic();
    }
    controlModifier = mp.keys.isDown(bindASCIIKeys.LCtrl);
    shiftModifier = mp.keys.isDown(bindASCIIKeys.Shift);
    let rot = noClipCamera.getRot(2);
    let fastMult = 0.1 + fastAccumulative;
    let slowMult = 1;
    // Shift and Ctrl multiplier
    if (shiftModifier) {
        fastMult *= 3;
    }
    else if (controlModifier) {
        slowMult = 0.5;
    }
    // Mouse wheel multiplier
    if (mp.game.controls.isControlPressed(2, 15) && currentVelocity !== velocities.length - 1) {
        fastAccumulative += velocities[currentVelocity] / 2;
        if (fastAccumulative >= velocities[currentVelocity + 1]) {
            currentVelocity++;
            mp.events.call("hud:short_info", `~progress_${currentVelocity}_${velocities.length - 1}_20vh_${getColor_velocity(currentVelocity)}~`, 2000);
        }
    }
    else if (mp.game.controls.isControlPressed(2, 14) && currentVelocity !== 0) {
        fastAccumulative -= velocities[currentVelocity] / 2;
        if (fastAccumulative <= velocities[currentVelocity - 1]) {
            currentVelocity--;
            mp.events.call("hud:short_info", `~progress_${currentVelocity}_${velocities.length - 1}_20vh_${getColor_velocity(currentVelocity)}~`, 2000);
        }
    }
    if (mp.keys.isDown(bindASCIIKeys.Q)) {
        fastAccumulative = 0;
        currentVelocity = 0;
    }
    let rightAxisX = mp.game.controls.getDisabledControlNormal(0, 220);
    let rightAxisY = mp.game.controls.getDisabledControlNormal(0, 221);
    let leftAxisX = mp.game.controls.getDisabledControlNormal(0, 218);
    let leftAxisY = mp.game.controls.getDisabledControlNormal(0, 219);
    let pos = noClipCamera.getCoord();
    let rr = noClipCamera.getDirection();
    let vector = new mp.Vector3(0, 0, 0);
    vector.x = rr.x * leftAxisY * fastMult * slowMult;
    vector.y = rr.y * leftAxisY * fastMult * slowMult;
    vector.z = rr.z * leftAxisY * fastMult * slowMult;
    let upVector = new mp.Vector3(0, 0, 1);
    let rightVector = getCrossProduct(getNormalizedVector(rr), getNormalizedVector(upVector));
    rightVector.x *= leftAxisX * fastMult * slowMult;
    rightVector.y *= leftAxisX * fastMult * slowMult;
    rightVector.z *= leftAxisX * fastMult * slowMult;
    let newPos = new mp.Vector3(pos.x - vector.x + rightVector.x, pos.y - vector.y + rightVector.y, pos.z - vector.z + rightVector.z);
    if (centerPoint) {
        let distance = mp.game.system.vdist(newPos.x, newPos.y, newPos.z, centerPoint.x, centerPoint.y, centerPoint.z);
        if (distance > maxRadius) {
            let direction = new mp.Vector3(newPos.x - centerPoint.x, newPos.y - centerPoint.y, newPos.z - centerPoint.z);
            let magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
            newPos.x = centerPoint.x + (direction.x / magnitude) * maxRadius;
            newPos.y = centerPoint.y + (direction.y / magnitude) * maxRadius;
            newPos.z = centerPoint.z + (direction.z / magnitude) * maxRadius;
        }
    }
    if (!mp.players.local.vehicle)
        mp.players.local.setHeading(noClipCamera.getRot(2).z);
    mp.players.local.setCoords(newPos.x + 1, newPos.y + 1, newPos.z + 1, true, false, false, false);
    noClipCamera.setCoord(newPos.x, newPos.y, newPos.z);
    noClipCamera.setRot(rot.x + rightAxisY * -10.0, 0.0, rot.z + rightAxisX * -10.0, 2);
});
function getColor_velocity(velocity) {
    if (velocity >= 0 && velocity <= 3)
        return "primary";
    else
        return "danger";
}

}
{
/** Implements player voice controlling and visual details */
mp.voiceChat.muted = true;
let playervoice_translations = {};
let voiceMuted = false;
let talkKeyDown = false;
let switchKeyDown = false;
let talkModes = [];
let talkModeIndex = 0;
let voiceEnabled = false;
let voiceVolumeMin = 0.05;
let currentVoiceVolume = 0.8;
const voiceConfig = {
    sendRate: 40,
    maxFramesPerPacket: 4,
    outgoingBufferSize: 5,
    incomingBufferSize: 0,
    enableRnnoise: 1,
    restartAudioStreams: 1
};
const BASSFXType = {
    BASS_FX_DX8_CHORUS: 0,
    BASS_FX_DX8_COMPRESSOR: 1,
    BASS_FX_DX8_DISTORTION: 2,
    BASS_FX_DX8_ECHO: 3,
    BASS_FX_DX8_FLANGER: 4,
    BASS_FX_DX8_GARGLE: 5,
    BASS_FX_DX8_I3DL2REVERB: 6,
    BASS_FX_DX8_PARAMEQ: 7,
    BASS_FX_DX8_REVERB: 8,
    BASS_FX_VOLUME: 9,
    // bass_fx.dll
    BASS_FX_BFX_PEAKEQ: 65540,
    BASS_FX_BFX_BQF: 65555
};
if (typeof mp.voiceChat.setExperimentalOption === "function") {
    for (let config in voiceConfig) {
        mp.voiceChat.setExperimentalOption(config, voiceConfig[config]);
    }
}
// events from the backend
mp.rpc("player:set_server_language", (lang) => {
    playervoice_translations = mp.getTranslations(['rechargedVoice', 'talkModes'], lang);
    talkModes = playervoice_translations['talkModes'];
});
mp.rpc("player:voice_range", (playerId, range) => {
    let p = mp.players.atRemoteId(playerId);
    if (!p)
        return;
    p.voiceRange = range;
});
mp.rpc("player:talk_modes", (modesJson) => {
    const previousTalkMode = talkModes[talkModeIndex];
    talkModes = JSON.parse(modesJson);
    if (talkModes.length === 0) {
        talkModeIndex = 0;
    }
    else {
        talkModeIndex = talkModeIndex % talkModes.length;
    }
    // if the previous talk mode is not in the new list, update talk mode
    if (previousTalkMode?.name !== talkModes[talkModeIndex]?.name) {
        setTalkMode(talkModeIndex);
    }
});
mp.rpc("player:talk_mode", (modeJson) => {
    let mode = JSON.parse(modeJson);
    for (let i = 0; i < talkModes.length; i++) {
        if (talkModes[i].name === mode.name) {
            setTalkMode(i);
            return;
        }
    }
});
mp.rpc("player:set_voice_mode", (id, mode) => {
    let p = mp.players.atRemoteId(id);
    if (!p)
        return;
    p.voiceMode = mode;
});
mp.events.add("player:test_voice", (id) => {
    const player = mp.players.atRemoteId(id);
    if (!player)
        return;
    const bassBfxBqfLowpass = 0;
    const bassBfxBqfHighpass = 1;
    const bassBfxChannelAll = -1;
    const bfqHandle = player.setVoiceFx(BASSFXType.BASS_FX_BFX_BQF, 0);
    const peakEqHandle = player.setVoiceFx(BASSFXType.BASS_FX_BFX_PEAKEQ, 0);
    mp.console.logInfo(`test voice activated for id: ${id} | handle: ${bfqHandle}`);
    setTimeout(() => {
        mp.console.logInfo(`timeout executed!`);
        player.setVoiceFxBQF(bfqHandle, {
            lFilter: bassBfxBqfHighpass,
            fCenter: 900.0,
            fGain: 0.0,
            fBandwidth: 0.86,
            fQ: 0.0,
            fS: 0.0,
            lChannel: bassBfxChannelAll
        });
        player.setVoiceFxBQF(bfqHandle, {
            lFilter: bassBfxBqfLowpass,
            fCenter: 1400.0,
            fGain: 0.0,
            fBandwidth: 0.83,
            fQ: 0.0,
            fS: 0.0,
            lChannel: bassBfxChannelAll
        });
        player.setVoiceFxPeakEq(peakEqHandle, {
            lBand: 0,
            fBandwidth: 13.0,
            fQ: 1070.0,
            fCenter: 0.0,
            fGain: 0.3,
            lChannel: bassBfxChannelAll
        });
        player.setVoiceFxPeakEq(peakEqHandle, {
            lBand: 1,
            fBandwidth: 13.0,
            fQ: 1300.0,
            fCenter: 0.0,
            fGain: 0.4,
            lChannel: bassBfxChannelAll
        });
        player.setVoiceFxVolume(bfqHandle, {
            fTarget: 2.0,
            fCurrent: -1,
            fTime: 0,
            lCurve: 0
        });
    }, 500);
});
mp.rpc("player:is_talking", (playerId, isTalking) => {
    let p = mp.players.atRemoteId(playerId);
    if (!p || p.handle === 0)
        return;
    p.isTalking = isTalking;
    if (isTalking) {
        p.playFacialAnim("mic_chatter", "mp_facial");
    }
    else {
        p.playFacialAnim("mood_normal_1", "facials@gen_male@variations@normal");
    }
});
mp.rpc("player:voice_muted", (muted) => {
    voiceMuted = muted;
});
function getListenerPosition() {
    // camera version: mp.playerCamera.getActiveCamera().getCoord()
    return mp.players.local.position;
}
/** This draws the mic on the head of people talking */
mp.events.add('render', () => {
    const localPos = getListenerPosition();
    // draw mic on head
    mp.players.forEachInStreamRange(player => {
        if (player.handle &&
            player.voiceRange > 0.1 &&
            player.voiceMode !== 'RADIO' &&
            player.isTalking) {
            let pos = player.position;
            let distQuad = mp.game.system.vdist2(localPos.x, localPos.y, localPos.z, pos.x, pos.y, pos.z);
            let shouldHear = distQuad < (player.voiceRange * player.voiceRange);
            if (!shouldHear)
                return player.voiceVolume = 0;
            const headPos = player.getBoneCoords(12844, 0, 0, 0);
            const screenPos = mp.game.graphics.world3dToScreen2d(headPos.x, headPos.y, headPos.z + 0.4);
            if (screenPos) { // sometimes null, idk why
                let visible = mp.raycasting.testPointToPoint(localPos, pos, null, 17) === undefined;
                if (visible) { // check for line-of-sigh
                    mp.game.graphics.drawSprite("mpleaderboard", "leaderboard_audio_3", screenPos.x, screenPos.y, 0.023, 0.023 * 1.5, 0, 255, 255, 255, 255);
                }
            }
        }
    });
    // enable/disable local voice
    let keyDown = mp.game.controls.isControlPressed(0, 249); // INPUT_PUSH_TO_TALK
    switchKeyDown = mp.game.controls.isControlPressed(0, 19); // LEFT ALT
    if (keyDown !== talkKeyDown && !switchKeyDown) {
        talkKeyDown = keyDown;
        onTalkKey(keyDown);
    }
    // change mode voice local voice
    let pushToTalk = mp.game.controls.isControlJustPressed(0, 249); // INPUT_PUSH_TO_TALK
    if (switchKeyDown && pushToTalk && !mp.gui.cursor.visible && !mp.isTypingOnPhone()) {
        switchTalkMode();
    }
});
// key detect - if they want to switch talk mode (fast press) or talk (holding)
function onTalkKey(toggle) {
    if (mp.isTypingOnPhone())
        return;
    if (toggle) {
        setTimeout(() => {
            if (talkKeyDown) { // still pressing
                setVoiceEnabled(true);
            }
        }, 70);
    }
    else {
        if (voiceEnabled) { // actually speaking, stop
            setVoiceEnabled(false);
        }
        else {
            if (!mp.gui.cursor.visible) {
                switchTalkMode();
            }
        }
    }
}
function setTalkMode(index) {
    talkModeIndex = index;
    let mic = getMic(talkModes[talkModeIndex].icon);
    mp.events.call("hud:talk_mode", talkModes[talkModeIndex].icon, talkModes[talkModeIndex].name);
    mp.events.call("hud:short_info", `~${mic.color}~ ~${mic.icon}~ ${talkModes[talkModeIndex].name}`, 500);
    mp.events.callRemote("player:on_switch_talk_mode", talkModes[talkModeIndex].name);
}
function switchTalkMode() {
    if (talkModes.length === 0)
        return;
    setTalkMode((talkModeIndex + 1) % talkModes.length);
}
mp.rpc("player_voice:toggle", () => {
    setVoiceEnabled(!voiceEnabled);
});
function setVoiceEnabled(enabled) {
    if (voiceEnabled === enabled)
        return;
    mp.voiceChat.muted = !enabled;
    mp.events.callRemote("player:on_toggle_voice", enabled);
    mp.events.call("hud:is_talking", enabled);
    voiceEnabled = enabled;
}
function getMic(icon) {
    switch (icon.toLowerCase()) {
        case "low": return { icon: "icon_microphone-alt", color: "c" };
        case "shout": return { icon: "icon_bullhorn", color: "c" };
        case "normal": return { icon: "icon_microphone", color: "c" };
        case "radio": return { icon: "icon_rss-square", color: "c" };
        default: return { icon: "icon_microphone", color: "c" };
    }
}
mp.game.graphics.requestStreamedTextureDict("mpleaderboard", true); // voice icon
mp.events.add("entityStreamIn", (entity) => {
    if (mp.players.exists(entity) && entity.handle && entity.type === "player") {
        // mute players as soon as they stream
        entity.voiceVolume = 0.0;
        entity.voiceAutoVolume = false;
    }
});
/** This timer updates the volume of players depending on the distance. */
mp.setInterval(() => {
    const localPos = getListenerPosition();
    mp.players.forEachInStreamRange(player => {
        if (mp.players.exists(player) && player.handle && player.voiceRange > 0.1) {
            // if using radio, voice volume is always 1
            if (player.voiceMode === "RADIO") {
                player.voiceVolume = Math.max(voiceVolumeMin, currentVoiceVolume);
                player.voice3d = false;
            }
            else {
                const playerPos = player.position;
                let dist = mp.game.system.vdist(playerPos.x, playerPos.y, playerPos.z, localPos.x, localPos.y, localPos.z);
                let finalVolume = Math.max(voiceVolumeMin, currentVoiceVolume) - (dist / player.voiceRange);
                if (finalVolume > 1)
                    finalVolume = 1;
                if (finalVolume < 0)
                    finalVolume = 0;
                player.voiceVolume = finalVolume;
                player.voice3d = true;
            }
        }
    });
}, 150);
mp.useInput(mp.input.RELOAD_VOICE, true, () => {
    mp.voiceChat.cleanupAndReload(true, true, true);
    mp.browserCall('hudVM', 'microphoneReload');
});
mp.rpc("player:voiceVolume", (amount) => {
    currentVoiceVolume = amount;
});

}
{
/** All animation-related natives for the player */
// all animation flags
const PlayerAnimationFlags = {
    Normal: 1,
    Loop: 2,
    Unk1: 4,
    Unk2: 8,
    UpperBody: 16,
    EnablePlayerControl: 32,
    Unk3: 64,
    Cancellable: 128,
    AdditiveAnimation: 256,
    DisableCollision: 512,
    DisableCollisionAndOffset: 1024,
    DisableCollisionAndPosition: 2048,
};
const dictsUsed = ["anim@heists@box_carry@", "mp_bank_heist_1", "mp_arresting", "dead", "cellphone@", "random@arrests"];
for (const dict of dictsUsed) {
    mp.game.streaming.requestAnimDict(dict);
}
// which things you can do while having a special action
const animationControls = {
    "CALL_PHONE": { sprint: true, hit: false, useVehicles: true, jump: false },
    "USE_PHONE": { sprint: false, hit: false, useVehicles: true, jump: false },
    "CARRY": { sprint: true, hit: false, useVehicles: false, jump: false },
    "USE_RADIO": { sprint: true, hit: false, useVehicles: true, jump: false },
    "CUFFED": { sprint: false, hit: false, useVehicles: false, jump: false }
};
// An extension of playAnimation that stops the animation
// gracefully after the given millis.
mp.rpc("animation:play", async (playerId, dict, name, speed, flags, time, speedMultiplier, startTime) => {
    let p = mp.players.atRemoteId(playerId);
    if (!p || p.handle === 0)
        return;
    let bitFlags = flags >>> 0;
    dict = dict.toLowerCase();
    name = name.toLowerCase();
    // ensure dictionary exists
    if (dict != "special" && !mp.game.streaming.doesAnimDictExist(dict))
        return;
    if (dict != "special" && !mp.game.streaming.hasAnimDictLoaded(dict)) {
        mp.game.streaming.requestAnimDict(dict);
        setTimeout(() => {
            mp.events.call("animation:play", playerId, dict, name, speed, flags, time, speedMultiplier, startTime);
        }, 200);
        return;
    }
    if (time <= 0)
        time = -1; // taskPlayAnim assumes time -1 as infinite
    // if playing an anim while using a ladder, clear tasks so
    // the player falls.
    if (p.getIsTaskActive(1)) {
        p.clearTasksImmediately();
    }
    // special case: reload
    if (dict === "special") {
        if (name === "reload") {
            p.taskReloadWeapon(true);
        }
    }
    else {
        let rot = p.getRotation(2);
        if (!checkAnimationFlag(bitFlags, PlayerAnimationFlags.EnablePlayerControl)) {
            p.taskPlayAnimAdvanced(dict, name, p.position.x, p.position.y, p.position.z, rot.x, rot.y, rot.z, speed, speed, time, flags, 0, 0, 0);
        }
        else {
            p.taskPlayAnim(dict, name, speed, speed, time, flags, 0.0, true, true, true);
        }
        if (speedMultiplier != 1.0) {
            while (!p.isPlayingAnim(dict, name, 3))
                await mp.game.waitAsync(0);
            p.setAnimSpeed(dict, name, speedMultiplier);
            p.setAnimCurrentTime(dict, name, startTime);
        }
    }
    // ensure anim: If the player isn't playing the anim 30ms before applying
    // it, clear the current task and re-apply.
    if (p.ensureAnimTimeout) {
        clearInterval(p.ensureAnimTimeout);
        p.ensureAnimTimeout = null;
    }
    if (!p.vehicle && (time <= 0 || time > 100) && dict !== "special") {
        p.ensureAnimTimeout = setTimeout(async () => {
            p.ensureAnimTimeout = null;
            let p2 = mp.players.atRemoteId(playerId);
            if (!p2 || p2.vehicle)
                return;
            if (!p2.isPlayingAnim(dict, name, 3)) {
                // replay anim but this time forcefully
                p2.clearTasksImmediately();
                let rot = p2.getRotation(2);
                if (!checkAnimationFlag(bitFlags, PlayerAnimationFlags.EnablePlayerControl)) {
                    p2.taskPlayAnimAdvanced(dict, name, p2.position.x, p2.position.y, p2.position.z, rot.x, rot.y, rot.z, speed / 2, speed / 2, time, flags, 0, 0, 0);
                }
                else {
                    p2.taskPlayAnim(dict, name, speed / 2, speed / 2, time, flags, 0.0, true, true, true);
                }
                if (speedMultiplier != 1.0 || startTime != 0.0) {
                    while (!p.isPlayingAnim(dict, name, 3))
                        await mp.game.waitAsync(0);
                    p.setAnimSpeed(dict, name, speedMultiplier);
                    p.setAnimCurrentTime(dict, name, startTime);
                }
            }
        }, 50);
    }
});
mp.rpc("animation:chatter", (type, id, time) => {
    let p = mp.getEntityForKindAndId(type, id);
    if (!p || p.handle === 0)
        return;
    p.playFacialAnim("mic_chatter", "mp_facial");
    if (time !== 0) {
        setTimeout(() => {
            mp.events.call("animation:stop_chattering", type, id);
        }, time);
    }
});
mp.rpc("animation:stop_chattering", (type, id) => {
    let p = mp.getEntityForKindAndId(type, id);
    if (!p || p.handle === 0)
        return;
    p.playFacialAnim("mood_normal_1", "facials@gen_male@variations@normal");
});
// Like rage animation stop, but also supports non-immediate stop
mp.rpc("animation:stop", (playerId, immediate) => {
    let p = mp.players.atRemoteId(playerId);
    if (!p || p.handle === 0)
        return;
    if (immediate) {
        p.clearTasksImmediately();
    }
    else {
        p.clearTasks();
    }
    if (p.ensureAnimTimeout) {
        clearInterval(p.ensureAnimTimeout);
        p.ensureAnimTimeout = null;
    }
});
mp.rpc("animation:set_time", (id, dict, name, time) => {
    const player = mp.players.atRemoteId(id);
    if (!player || player.handle === 0)
        return;
    player.setAnimCurrentTime(dict, name, time);
});
mp.rpc("animation:set_speed_multiplier", (id, dict, name, multiplier) => {
    const player = mp.players.atRemoteId(id);
    if (!player || player.handle === 0)
        return;
    player.setAnimSpeed(dict, name, multiplier);
});
mp.setWalkingStyle = function (player, style, tryNumber) {
    if (tryNumber > 20)
        return;
    if (!mp.players.exists(player) || player.handle === 0) {
        mp.console.logWarning(`cant set walkstyle for expired player object`);
        return;
    }
    if (!style) {
        player.resetMovementClipset(0.7);
    }
    else {
        if (!mp.game.streaming.hasClipSetLoaded(style)) {
            mp.game.streaming.requestClipSet(style);
            setTimeout(() => {
                mp.setWalkingStyle(player, style, tryNumber + 1);
            }, 100);
        }
        player.setMovementClipset(style, 0.7);
    }
};
mp.rpc("player:set_walk_style", (playerId, walkStyle) => {
    let p = mp.players.atRemoteId(playerId);
    if (!p)
        return;
    if (p.handle) {
        mp.setWalkingStyle(p, walkStyle == "" ? null : walkStyle, 0);
    }
    p.walkStyle = walkStyle;
});
// implement special actions, aka "body animations", which can be combined with other animations.
// may use an extra "playerId" parameter to sync special actions among players.
mp.rpc("animation:set_special_action", (playerId, action) => {
    let p = mp.players.atRemoteId(playerId);
    if (!p)
        return;
    if (action === "NONE" && p.specialAction !== "NONE" && p.handle) {
        // clear hands
        p.taskPlayAnim('amb@world_human_aa_smoke@male@idle_a', 'idle_a', 3, 3, 10, 48, 0.5, false, false, false);
    }
    p.specialAction = action;
});
mp.rpc("player:walk_to_position", (id, position, speed, heading) => {
    const player = mp.players.atRemoteId(id);
    if (!player || player.handle === 0)
        return;
    player.taskGoStraightToCoord(position.x, position.y, position.z, speed, -1, heading, 0);
});
mp.events.add("entityStreamOut", (entity) => {
    if (entity.type === 'player' && entity.specialAction !== undefined) {
        delete entity.specialAction;
    }
});
mp.setInterval(() => {
    mp.players.forEachInStreamRange(p => {
        if (mp.players.exists(p) && p.handle) {
            if (p.specialAction !== undefined && p.specialAction !== "NONE") {
                // don't allow to use ladders while using hands
                if (p.getIsTaskActive(1)) {
                    p.clearTasksImmediately();
                }
                let action = p.specialAction;
                if (action === "CALL_PHONE") {
                    if (!p.isPlayingAnim("cellphone@", "cellphone_text_to_call", 3)) {
                        p.taskPlayAnim("cellphone@", "cellphone_text_to_call", 3.0, -3, -1, 50, 0, false, false, false);
                    }
                }
                else if (action === "USE_PHONE") {
                    if (!p.isPlayingAnim("cellphone@", "cellphone_text_in", 3)) {
                        p.taskPlayAnim("cellphone@", "cellphone_text_in", 3.0, -3, -1, 50, 0, false, false, false);
                    }
                }
                else if (action === "USE_RADIO") {
                    if (!p.isPlayingAnim("random@arrests", "generic_radio_chatter", 3)) {
                        p.taskPlayAnim("random@arrests", "generic_radio_chatter", 3.0, -3, -1, 49, 0, false, false, false);
                    }
                }
                else if (action === "CARRY") {
                    if (!p.isPlayingAnim("anim@heists@box_carry@", "idle", 3)) {
                        p.taskPlayAnim("anim@heists@box_carry@", "idle", 8.0, -8, -1, 49, 0, false, false, false);
                    }
                }
                else if (action === "CUFFED") {
                    let libToPlay = "";
                    let animToPlay = "";
                    if (p.isPlayingAnim("mp_bank_heist_1", "prone_r_loop", 3)) {
                        libToPlay = "dead";
                        animToPlay = "dead_f";
                    }
                    else {
                        libToPlay = "mp_arresting";
                        animToPlay = "idle";
                    }
                    if (!p.isPlayingAnim(libToPlay, animToPlay, 3)) {
                        p.taskPlayAnim(libToPlay, animToPlay, 8.0, -8, -1, 49, 0, false, false, false);
                    }
                }
            }
        }
    });
}, 50);
mp.events.add("render", () => {
    let p = mp.players.local;
    // disable click-only fire always
    mp.game.controls.disableControlAction(0, 257, true);
    // disable cinematic camera while in vehicle
    mp.game.controls.disableControlAction(0, 80, true);
    // disable silent mode (duck)
    mp.game.controls.disableControlAction(0, 36, true);
    // disable X while on vehicles
    mp.game.controls.disableControlAction(0, 73, true);
    // disable jump, hit, enter vehicle and some more while playing a hand action.
    if (p.specialAction !== undefined && p.specialAction !== "NONE") {
        mp.game.controls.disableControlAction(0, 44, true); // cover
        mp.game.controls.disableControlAction(0, 45, true); // reload
        mp.game.controls.disableControlAction(0, 36, true); // duck
        let controls = animationControls[p.specialAction];
        if (controls) {
            if (!controls.sprint) {
                mp.game.controls.disableControlAction(0, 21, true); // space
            }
            if (!controls.hit) {
                mp.game.controls.disableControlAction(0, 24, true); // fire
                mp.game.controls.disableControlAction(0, 25, true); // aim
                mp.game.controls.disableControlAction(0, 50, true); // aim zoom
                mp.game.controls.disableControlAction(0, 140, true); // melee light
                mp.game.controls.disableControlAction(0, 141, true); // melee heavy
            }
            if (!controls.jump) {
                mp.game.controls.disableControlAction(0, 22, true);
            }
            if (!controls.useVehicles) {
                mp.game.controls.disableControlAction(0, 23, true);
            }
        }
    }
});
function checkAnimationFlag(flags, value) {
    return (flags & value) ? true : false;
}
// Animations system (with arrows change the current animation)
const PLAYER_LOCAL_ANIMATION = mp.players.local;
const ANIMATIONS = {
    "anim@amb@nightclub@lazlow@hi_podium@": {
        "dictname": "anim@amb@nightclub@lazlow@hi_podium@",
        "variations": ["danceidle_hi_13_crotchgrab_laz", "danceidle_li_11_bigbase_laz", "danceidle_hi_17_spiderman_laz"]
    },
    "anim@amb@nightclub@dancers@crowddance_groups@": {
        "dictname": "anim@amb@nightclub@dancers@crowddance_groups@",
        "variations": ["hi_dance_crowd_09_v1_female^1", "hi_dance_crowd_09_v1_male^6", "hi_dance_crowd_13_v2_male^2"]
    },
    "timetable@tracy@ig_5@idle_a": {
        "dictname": "timetable@tracy@ig_5@idle_a",
        "variations": ["idle_c", "idle_b", "idle_a"]
    },
    "timetable@tracy@ig_5@idle_b": {
        "dictname": "timetable@tracy@ig_5@idle_b",
        "variations": ["idle_c", "idle_e", "idle_c"]
    },
    "anim@amb@casino@mini@dance@dance_solo@female@var_b@": {
        "dictname": "anim@amb@casino@mini@dance@dance_solo@female@var_b@",
        "variations": ["high_center", "high_center_down", "high_center_up"]
    },
    "anim@amb@nightclub@lazlow@ig1_vip@": {
        "dictname": "anim@amb@nightclub@lazlow@ig1_vip@",
        "variations": ["clubvip_base_laz", "ambclub_to_clubvip_laz", "clubvip_to_ambclub_laz"]
    },
    "anim@amb@nightclub@mini@dance@dance_solo@male@var_a@": {
        "dictname": "anim@amb@nightclub@mini@dance@dance_solo@male@var_a@",
        "variations": ["high_center", "high_center_down", "high_center_up"]
    },
    "anim@mp_player_intcelebrationfemale@air_synt": {
        "dictname": "anim@mp_player_intcelebrationfemale@air_synt",
        "variations": ["air_synth", "air_synth_facial", "air_synth"]
    },
    "missfbi3_sniping": {
        "dictname": "missfbi3_sniping",
        "variations": ["male_unarmed_a", "male_unarmed_b", "male_unarmed_a"]
    },
    "anim@amb@nightclub@dancers@crowddance_groups@hi_intensity": {
        "dictname": "anim@amb@nightclub@dancers@crowddance_groups@hi_intensity",
        "variations": ["hi_dance_crowd_09_v1_female^1", "hi_dance_crowd_15_v2_male^3", "hi_dance_crowd_09_v1_male^1"]
    },
    "anim@amb@nightclub@dancers@crowddance_groups@low_intensity": {
        "dictname": "anim@amb@nightclub@dancers@crowddance_groups@low_intensity",
        "variations": ["li_dance_crowd_09_v1_female^1", "li_dance_crowd_09_v1_male^2", "li_dance_crowd_09_v1_male^6"]
    },
    "anim@amb@nightclub@dancers@crowddance_facedj@": {
        "dictname": "anim@amb@nightclub@dancers@crowddance_facedj@",
        "variations": ["hi_dance_facedj_09_v1_male^1", "hi_dance_facedj_09_v1_female^4", "hi_dance_facedj_09_v2_male^1"]
    },
    "anim@amb@nightclub@dancers@crowddance_facedj@hi_intensity": {
        "dictname": "anim@amb@nightclub@dancers@crowddance_facedj@hi_intensity",
        "variations": ["hi_dance_facedj_09_v1_male^1", "hi_dance_facedj_09_v1_female^2", "hi_dance_facedj_09_v2_female^2"]
    },
    "move_clown@p_m_zero_idles@": {
        "dictname": "move_clown@p_m_zero_idles@",
        "variations": ["fidget_look_at_oufit_a", "fidget_look_at_oufit_b", "fidget_short_dance"]
    },
    "anim@amb@casino@mini@dance@dance_solo@female@var_a@": {
        "dictname": "anim@amb@casino@mini@dance@dance_solo@female@var_a@",
        "variations": ["high_center", "high_center_down", "high_left"]
    },
    "anim@amb@nightclub@dancers@crowddance_facedj_transitions@from_hi_intensity": {
        "dictname": "anim@amb@nightclub@dancers@crowddance_facedj_transitions@from_hi_intensity",
        "variations": ["trans_dance_facedj_hi_to_li_07_v1_female^3", "trans_dance_facedj_hi_to_li_07_v1_male^6", "trans_dance_facedj_hi_to_li_09_v1_female^6"]
    },
    "anim@amb@nightclub@mini@dance@dance_solo@female@var_a@": {
        "dictname": "anim@amb@nightclub@mini@dance@dance_solo@female@var_a@",
        "variations": ["high_center", "high_center_down", "high_center_up"]
    },
    "anim@amb@nightclub@dancers@black_madonna_entourage@": {
        "dictname": "anim@amb@nightclub@dancers@black_madonna_entourage@",
        "variations": ["li_dance_facedj_11_v1_male^1", "hi_dance_facedj_09_v2_male^5", "li_dance_facedj_15_v2_male^2"]
    },
    "special_ped@mountain_dancer@monologue_2@monologue_2a": {
        "dictname": "special_ped@mountain_dancer@monologue_2@monologue_2a",
        "variations": ["mnt_dnc_buttwag", "mnt_dnc_buttwag", "mnt_dnc_angel"]
    },
};
let doingDict = "";
let doingVariation = "";
let currentSpeed = 1;
function isPlayingAnim() {
    let boolean = false;
    for (let index = 0; index < Object.values(ANIMATIONS).length; index++) {
        const element = Object.values(ANIMATIONS)[index];
        const dict = element.dictname;
        element.variations.forEach(variation => {
            if (PLAYER_LOCAL_ANIMATION.isPlayingAnim(dict, variation, 3)) {
                doingDict = dict;
                doingVariation = variation;
                boolean = true;
            }
        });
    }
    return boolean;
}
function applyAnim(dict, anim) {
    PLAYER_LOCAL_ANIMATION.clearTasks();
    mp.game.streaming.requestAnimDict(dict);
    PLAYER_LOCAL_ANIMATION.taskPlayAnim(dict, anim, 1.0, 1.0, -1, 1, 0.0, false, false, false);
    PLAYER_LOCAL_ANIMATION.setAnimSpeed(doingDict, doingVariation, currentSpeed);
}
function speedAdd() {
    let newSpeed = (currentSpeed + 0.05);
    if (newSpeed <= 1.4) {
        currentSpeed = newSpeed;
        PLAYER_LOCAL_ANIMATION.setAnimSpeed(doingDict, doingVariation, currentSpeed);
    }
}
function speedRemove() {
    let newSpeed = (currentSpeed - 0.05);
    if (newSpeed >= 0.85) {
        currentSpeed = newSpeed;
        PLAYER_LOCAL_ANIMATION.setAnimSpeed(doingDict, doingVariation, currentSpeed);
    }
}
mp.useInput(mp.input.ANIMATION_INCREASE_SPEED, true, function () {
    if (isPlayingAnim()) {
        speedAdd();
    }
});
mp.useInput(mp.input.ANIMATION_DECREASE_SPEED, true, function () {
    if (isPlayingAnim()) {
        speedRemove();
    }
});
mp.useInput(mp.input.ANIMATION_CHANGE_VARIATION_0, true, function () {
    if (isPlayingAnim()) {
        changeVariation(0);
    }
});
mp.useInput(mp.input.ANIMATION_CHANGE_VARIATION_1, true, function () {
    if (isPlayingAnim()) {
        changeVariation(1);
    }
});
mp.useInput(mp.input.ANIMATION_CHANGE_VARIATION_2, true, function () {
    if (isPlayingAnim()) {
        changeVariation(2);
    }
});
function changeVariation(number) {
    let animLib = ANIMATIONS[doingDict];
    let variation = animLib.variations[number];
    if (variation !== doingVariation) {
        applyAnim(doingDict, variation);
        doingVariation = variation;
    }
}

}
{
/** Implements edition of attachment coordinates. */
let Keys = {
    Up: 0x26,
    Down: 0x28,
    Left: 0x25,
    Right: 0x27,
    Space: 0x20,
    Alt: 0x12,
    Shift: 16,
    G: 0x47, // reset rotation
    Enter: 0x0D,
    Backspace: 0x08
};
let object = null;
let offset = null;
let rotation = null;
let boneIdx = 0;
let lastFrameMs = 0;
mp.rpc("player:edit_attachment", (hash, bone, initialOffset, initialRotation) => {
    if (object) {
        object.destroy();
        object = null;
        offset = null;
        rotation = null;
    }
    object = mp.objects.new(hash, mp.players.local.position, { dimension: -1 });
    if (object == null) {
        mp.game.graphics.notify('~r~Bad model. Cancelled');
        mp.events.callRemote("player:on_finish_attachment_edition", false, JSON.stringify(new mp.Vector3(0, 0, 0)), JSON.stringify(new mp.Vector3(0, 0, 0)));
        return;
    }
    mp.game.graphics.notify('arrows: move (+shift for height)~n~space: pos/rot~n~Enter: save~n~Backspace: Cancel');
    mp.editingAttachments = true;
    offset = JSON.parse(initialOffset);
    rotation = JSON.parse(initialRotation);
    boneIdx = bone;
    lastFrameMs = 0;
});
mp.useInput(mp.input.EDITION_SAVE, true, function () {
    if (!object || mp.gui.cursor.visible)
        return;
    object.destroy();
    object = null;
    mp.events.callRemote("player:on_finish_attachment_edition", true, JSON.stringify(offset), JSON.stringify(rotation));
    offset = null;
    rotation = null;
    mp.game.graphics.notify('Saved');
    mp.editingAttachments = false;
});
mp.useInput(mp.input.EDITION_CANCEL, true, function () {
    if (!object || mp.gui.cursor.visible)
        return;
    object.destroy();
    object = null;
    mp.events.callRemote("player:on_finish_attachment_edition", false, JSON.stringify(new mp.Vector3(0, 0, 0)), JSON.stringify(new mp.Vector3(0, 0, 0)));
    offset = null;
    rotation = null;
    mp.game.graphics.notify('Cancelled');
    mp.editingAttachments = false;
});
mp.events.add("render", () => {
    if (!object || mp.gui.cursor.visible)
        return;
    let time = new Date().getTime();
    if (lastFrameMs === 0)
        lastFrameMs = time;
    let delta = (time - lastFrameMs) / 1000.0; // delta in seconds.
    lastFrameMs = time;
    // weird: on the first frame, all keys are "down".
    let up = mp.keys.isDown(Keys.Up);
    let down = mp.keys.isDown(Keys.Down);
    let left = mp.keys.isDown(Keys.Left);
    let right = mp.keys.isDown(Keys.Right);
    let alt = mp.keys.isDown(Keys.Alt);
    let shift = mp.keys.isDown(Keys.Shift);
    let space = mp.keys.isDown(Keys.Space);
    // Movements:
    // Shift+Up/Down: height
    // left-right, up-down: movement
    // Space (keep to invert rotation/position)
    let objToEdit = null;
    let m = .25 * delta;
    if (space) {
        objToEdit = rotation;
        shift = !shift; // dont use rotation in weird axis
        m = 40 * delta;
    }
    else {
        objToEdit = offset;
    }
    // Shift (up/down)
    if (up && shift) {
        objToEdit.x = objToEdit.x - m;
    }
    else if (down && shift) {
        objToEdit.x = objToEdit.x + m;
    }
    // Regular xy movement
    if (up && !shift) {
        objToEdit.y = objToEdit.y + m;
    }
    else if (down && !shift) {
        objToEdit.y = objToEdit.y - m;
    }
    if (left) {
        objToEdit.z = objToEdit.z - m;
    }
    else if (right) {
        objToEdit.z = objToEdit.z + m;
    }
    let posCoords = offset.x.toFixed(2) + " " + offset.y.toFixed(2) + " " + offset.z.toFixed(2);
    let rotCoords = rotation.x.toFixed(0) + " " + rotation.y.toFixed(0) + " " + rotation.z.toFixed(0);
    if (!space) {
        posCoords = "~r~" + posCoords + "~w~";
    }
    else {
        rotCoords = "~r~" + rotCoords + "~w~";
    }
    mp.game.graphics.drawText("pos: " + posCoords + "~n~rot: " + rotCoords, [0.5, 0.9], {
        font: 0,
        color: [255, 255, 255, 255],
        scale: [0.5, 0.5],
        outline: false
    });
    let entity = mp.players.local;
    object.attachTo(entity.handle, entity.getBoneIndex(boneIdx), offset.x, offset.y, offset.z, rotation.x, rotation.y, rotation.z, false, false, false, false, 2, true);
});

}
player_attachmenteditor.js
{
/** Implements health and damage functions and events. */
let cooldown = 5000;
let lastSended = 0;
mp.events.add("outgoingDamage", (srcEntity, dstEntity, targetPlayer, weapon, boneIndex, damage) => {
    if (targetPlayer && targetPlayer.handle !== 0 && targetPlayer.type === 'player' && dstEntity === targetPlayer) {
        mp.events.callRemote("health:on_player_shot_player", targetPlayer.remoteId, boneIndex, weapon);
    }
});
let currentHealth = 100;
mp.rpc("player:set_health", (health) => {
    if (health < 0)
        health = 0;
    currentHealth = Math.round(health);
    mp.players.local.setHealth(100 + Math.round(health));
    mp.browserCall("hudVM", "setHealth", currentHealth);
});
// respawn when dies
// detect damage
mp.events.add("render", () => {
    let p = mp.players.local;
    let h = p.getHealth();
    if (h !== currentHealth) {
        if (h < currentHealth) { // take damage
            mp.events.callRemote("health:on_take_damage", (currentHealth - h), 0);
        }
        p.setHealth(100 + currentHealth);
    }
});
mp.game.gameplay.setFadeOutAfterDeath(false);
mp.game.gameplay.disableAutomaticRespawn(true);
mp.game.gameplay.ignoreNextRestart(true);
mp.game.gameplay.setFadeInAfterDeathArrest(false);
mp.game.gameplay.setFadeInAfterLoad(false);
mp.game.player.setHealthRechargeMultiplier(0);
// set proofs interval
mp.setInterval(() => {
    let localPlayer = mp.players.local;
    localPlayer.setProofs(true, true, true, false, true, true, true, false);
    if (localPlayer.canRagdoll() && !localPlayer.ragdoll && Date.now() - lastSended > cooldown) {
        let pos = mp.players.local.position;
        if (localPlayer.isRagdoll() && !localPlayer.isBeingStunned(0) && mp.game.vehicle.isAnyVehicleNearPoint(pos.x, pos.y, pos.z, 5)) {
            lastSended = Date.now();
            mp.events.callRemote("health:possible_carkill");
        }
    }
}, 200);

}
player_health.js
player_camera.js
{
/** Implements input bindings for GTA. */
let playerinput_translations = {};
let keysDown = {};
let clickDown = false;
let keyDownTime = {};
function sendInputPress(input, pressed) {
    mp.events.call('player:on_input', input, pressed);
    mp.events.callRemote('player:on_input', input, pressed);
}
for (const inputType in mp.input) {
    let input = mp.input[inputType];
    let keyCode = input.key;
    let constInputType = inputType;
    let triggerOnRelease = input.triggerOnRelease || false;
    if (keyCode !== 0) {
        mp.useInput(input, true, function () {
            if (!mp.gui.cursor.visible && !mp.game.ui.isPauseMenuActive() && !(constInputType in keysDown)) {
                keysDown[constInputType] = true;
                if (triggerOnRelease) { // in this case will trigger if releases the key quickly
                    keyDownTime[constInputType] = new Date().getTime();
                }
                else {
                    sendInputPress(constInputType, true);
                }
            }
        });
        mp.useInput(input, false, function () {
            if (constInputType in keysDown) {
                if (triggerOnRelease) {
                    let timeDown = new Date().getTime() - (keyDownTime[constInputType] || 0);
                    if (timeDown < 400) {
                        sendInputPress(constInputType, true);
                        sendInputPress(constInputType, false);
                    }
                }
                else {
                    sendInputPress(constInputType, false);
                }
                delete keysDown[constInputType];
            }
        });
    }
}
mp.events.add("click", (x, y, upOrDown, leftOrRight, relativeX, relativeY, worldPosition, hitEntity) => {
    if (leftOrRight === "left") {
        let pressed = upOrDown === "down";
        if (!pressed && clickDown) {
            sendInputPress("USE_HAND_ITEM", false);
            clickDown = false;
        }
        else {
            if (!mp.gui.cursor.visible && !mp.game.ui.isPauseMenuActive()) {
                if (new Date().getTime() - mp.getLastUIHide() > 500) {
                    sendInputPress("USE_HAND_ITEM", true);
                    clickDown = true;
                }
            }
        }
    }
});
mp.rpc("player:set_server_language", (lang) => {
    playerinput_translations = mp.getTranslations(['showMenu',
        'talk',
        'chat',
        'animations',
        'phone',
        'inventory',
        'point',
        'unlockVehicle',
        'startEngine',
        'vehicleMenu',
        'vehiclePassenger',
        'togglePhoneCamera',
        'augmentFilter',
        'reduceFilter',
        'takePhoto',
        'moveSelfieCam',
        'toggleHud',
        'toggleHelp'
    ], lang);
});
// Animation shortcuts
const animationShortcutKeys = {
    // key numbers
    ANIMATION_1: 0x31,
    ANIMATION_2: 0x32,
    ANIMATION_3: 0x33,
    ANIMATION_4: 0x34,
    ANIMATION_5: 0x35,
    ANIMATION_6: 0x36,
    ANIMATION_7: 0x37,
    ANIMATION_8: 0x38,
    ANIMATION_9: 0x39
};
let animKey = 0x12; // Alt (will be this+number)
for (const shortcut in animationShortcutKeys) {
    let keyCode = animationShortcutKeys[shortcut];
    let shortcutConst = shortcut;
    mp.keys.bind(keyCode, true, () => {
        try {
            if (!mp.gui.cursor.visible && !mp.game.ui.isPauseMenuActive()) {
                if (!mp.players.local.vehicle && mp.keys.isDown(animKey)) {
                    sendInputPress(shortcutConst, true);
                    sendInputPress(shortcutConst, false);
                    keyDownTime["ANIMATION_STOP"] = 0; // hack to "invalidate" the stop anim button (because is triggerOnRelease)
                }
            }
        }
        catch (e) {
            mp.console.logError(`Error on animation shortcut ${shortcut}: ${e}`);
        }
    });
}

}
player_input.js
{
//Fingerpointing
let pointing = {
    active: false,
    interval: null,
    lastSent: 0,
    start: function () {
        if (!this.active) {
            this.active = true;
            mp.game.streaming.requestAnimDict("anim@mp_point");
            while (!mp.game.streaming.hasAnimDictLoaded("anim@mp_point")) {
                mp.game.wait(0);
            }
            mp.game.invoke("0x0725a4ccfded9a70", mp.players.local.handle, 0, 1, 1, 1);
            mp.players.local.setConfigFlag(36, true);
            mp.players.local.taskMoveNetwork("task_mp_pointing", 0.5, false, "anim@mp_point", 24);
            mp.game.streaming.removeAnimDict("anim@mp_point");
            this.interval = setInterval(this.process.bind(this), 0);
        }
    },
    stop: function () {
        this.active &&
            (clearInterval(this.interval),
                (this.interval = null),
                (this.active = !1),
                mp.game.invoke("0xd01015c7316ae176", mp.players.local.handle, "Stop"),
                !mp.game.invoke("0x84A2DD9AC37C35C1", mp.players.local.handle) &&
                    mp.game.invoke("0x176CECF6F920D707", mp.players.local.handle),
                !mp.players.local.isInAnyVehicle(!0) && mp.game.invoke("0x0725a4ccfded9a70", mp.players.local.handle, 1, 1, 1, 1),
                mp.players.local.setConfigFlag(36, !1));
    },
    gameplayCam: mp.cameras.new("gameplay"),
    lastSync: 0,
    getRelativePitch: function () {
        let camRot = this.gameplayCam.getRot(2);
        return camRot.x - mp.players.local.getPitch();
    },
    process: function () {
        if (this.active) {
            mp.game.invoke("0x921ce12c489c4c41", mp.players.local.handle);
            let camPitch = this.getRelativePitch();
            if (camPitch < -70.0) {
                camPitch = -70.0;
            }
            else if (camPitch > 42.0) {
                camPitch = 42.0;
            }
            camPitch = (camPitch + 70.0) / 112.0;
            let camHeading = mp.game.cam.getGameplayCamRelativeHeading();
            let cosCamHeading = mp.game.system.cos(camHeading);
            let sinCamHeading = mp.game.system.sin(camHeading);
            if (camHeading < -180.0) {
                camHeading = -180.0;
            }
            else if (camHeading > 180.0) {
                camHeading = 180.0;
            }
            camHeading = (camHeading + 180.0) / 360.0;
            let coords = mp.players.local.getOffsetFromGivenWorldCoords((cosCamHeading * -0.2) - (sinCamHeading * (0.4 * camHeading + 0.3)), (sinCamHeading * -0.2) + (cosCamHeading * (0.4 * camHeading + 0.3)), 0.6);
            let blocked = (typeof mp.raycasting.testPointToPoint(new mp.Vector3(coords.x, coords.y, coords.z - 0.2), new mp.Vector3(coords.x, coords.y, coords.z + 0.2), mp.players.local.handle, 7) !== 'undefined');
            mp.game.invoke('0xd5bb4025ae449a4e', mp.players.local.handle, "Pitch", camPitch);
            mp.game.invoke('0xd5bb4025ae449a4e', mp.players.local.handle, "Heading", camHeading * -1.0 + 1.0);
            mp.game.invoke('0xb0a6cfd2c69c1088', mp.players.local.handle, "isBlocked", blocked);
            mp.game.invoke('0xb0a6cfd2c69c1088', mp.players.local.handle, "isFirstPerson", mp.game.invoke('0xee778f8c7e1142e2', mp.game.invoke('0x19cafa3c87f7c2ff')) == 4);
            if ((Date.now() - this.lastSent) > 100) {
                this.lastSent = Date.now();
                mp.events.originalCallRemote("fpsync.update", camPitch, camHeading);
            }
        }
    }
};
mp.events.add("fpsync.update", (id, camPitch, camHeading) => {
    let netPlayer = mp.players.atRemoteId(id);
    if (mp.players.exists(netPlayer) && netPlayer.handle) {
        netPlayer.lastReceivedPointing = Date.now();
        if (netPlayer.pointingInterval === undefined) {
            netPlayer.pointingInterval = setInterval((function () {
                if ((Date.now() - netPlayer.lastReceivedPointing) > 1000) {
                    clearInterval(netPlayer.pointingInterval);
                    netPlayer.lastReceivedPointing = undefined;
                    netPlayer.pointingInterval = undefined;
                    mp.game.invoke("0xd01015c7316ae176", netPlayer.handle, "Stop");
                    if (!netPlayer.isInAnyVehicle(true)) {
                        mp.game.invoke("0x0725a4ccfded9a70", netPlayer.handle, 1, 1, 1, 1);
                    }
                    netPlayer.setConfigFlag(36, false);
                }
            }).bind(netPlayer), 500);
            mp.game.streaming.requestAnimDict("anim@mp_point");
            while (!mp.game.streaming.hasAnimDictLoaded("anim@mp_point")) {
                mp.game.wait(0);
            }
            mp.game.invoke("0x0725a4ccfded9a70", netPlayer.handle, 0, 1, 1, 1);
            netPlayer.setConfigFlag(36, true);
            netPlayer.taskMoveNetwork("task_mp_pointing", 0.5, false, "anim@mp_point", 24);
            mp.game.streaming.removeAnimDict("anim@mp_point");
        }
        mp.game.invoke('0xd5bb4025ae449a4e', netPlayer.handle, "Pitch", camPitch);
        mp.game.invoke('0xd5bb4025ae449a4e', netPlayer.handle, "Heading", camHeading * -1.0 + 1.0);
        mp.game.invoke('0xb0a6cfd2c69c1088', netPlayer.handle, "isBlocked", 0);
        mp.game.invoke('0xb0a6cfd2c69c1088', netPlayer.handle, "isFirstPerson", 0);
    }
});
mp.useInput(mp.input.ANIMATION_POINT, true, () => {
    if (!mp.gui.cursor.visible && !mp.players.local.specialAction?.includes("PHONE")) {
        pointing.start();
    }
});
mp.useInput(mp.input.ANIMATION_POINT, false, () => {
    pointing.stop();
});

}
fingerpointing.js
{
const carry = {
    targetSrc: -1,
    personInitCarrying: {
        animDict: "anim@heists@load_box",
        anim: "lift_box",
        flag: 2
    },
    personCarrying: {
        animDict: "missfinale_c2mcs_1",
        anim: "fin_c2_mcs_1_camman",
        flag: 49
    },
    personCarried: {
        animDict: "nm",
        anim: "firemans_carry",
        attachX: 0.25,
        attachY: 0.15,
        attachZ: 0.63,
        flag: 1
    }
};
let carriedBy = null;
let carring = null;
/** Pre-load anims */
mp.game.streaming.requestAnimDict(carry.personInitCarrying.animDict);
mp.game.streaming.requestAnimDict(carry.personCarrying.animDict);
mp.game.streaming.requestAnimDict(carry.personCarried.animDict);
/** The playerId carry the targetId and start carry */
mp.rpc("player:carry_injured", (playerId, targetId, haveAnim) => {
    let player = mp.players.atRemoteId(playerId);
    let target = mp.players.atRemoteId(targetId);
    if (!mp.players.exists(player) || !mp.players.exists(target) || !player.handle || !target.handle)
        return mp.console.logWarning(`cant execute event 'player:carry_injured' with error: player or target not exists`);
    if (haveAnim)
        player.taskPlayAnim(carry.personInitCarrying.animDict, carry.personInitCarrying.anim, 4.0, 4.0, 2000, carry.personInitCarrying.flag, 0, false, false, false);
    setTimeout(() => {
        try {
            if (!mp.players.exists(player) || !mp.players.exists(target) || !player.handle || !target.handle)
                return mp.console.logWarning(`cant execute event 'player:carry_injured' with error: player or target not exists in timeout`);
            // only apply one animation, rage sync
            if (mp.players.local === player) {
                player.taskPlayAnim(carry.personCarrying.animDict, carry.personCarrying.anim, 4.0, 4.0, -1, carry.personCarrying.flag, 1.0, false, false, false);
                carring = target;
            }
            if (mp.players.local === target) {
                target.taskPlayAnim(carry.personCarried.animDict, carry.personCarried.anim, 4.0, 4.0, -1, carry.personCarried.flag, 1.0, false, false, false);
                carriedBy = player;
            }
            target.attachTo(player.handle, 0, carry.personCarried.attachX, carry.personCarried.attachY, carry.personCarried.attachZ, 0.5, 0.5, 0, true, false, true, false, 0, true);
        }
        catch (e) {
            mp.console.logWarning(`cant execute event 'player:uncarry_injured' with error: ${e}`);
        }
    }, 1800);
});
/** The playerId detach targetId and stop carry */
mp.rpc("player:uncarry_injured", (playerId, targetId, haveAnim) => {
    let player = mp.players.atRemoteId(playerId);
    let target = mp.players.atRemoteId(targetId);
    if (!mp.players.exists(player) || !mp.players.exists(target) || !player.handle || !target.handle)
        return;
    if (haveAnim)
        player.taskPlayAnim(carry.personInitCarrying.animDict, carry.personInitCarrying.anim, 4.0, 4.0, 2000, carry.personInitCarrying.flag, 0, false, false, false);
    setTimeout(() => {
        try {
            if (!mp.players.exists(player) || !mp.players.exists(target) || !player.handle || !target.handle)
                return;
            target.clearTasks();
            player.clearTasks();
            if (target === mp.players.local) {
                carriedBy = null;
            }
            else if (player === mp.players.local) {
                carring = null;
            }
            target.detach(true, false);
        }
        catch (e) {
            mp.console.logWarning(`cant execute event 'player:uncarry_injured' with error: ${e}`);
        }
    }, 1700);
});
mp.events.add("entityStreamIn", (entity) => {
    if (entity.type === "player") {
        if (entity === carriedBy) {
            mp.events.call("player:carry_injured", entity.remoteId, mp.players.local.remoteId, false);
        }
        else if (entity === carring) {
            mp.events.call("player:carry_injured", mp.players.local.remoteId, entity.remoteId, false);
        }
    }
});

}
carry.js
{
let resyncTime = 0;
mp.rpc("player:toggle_spectate_mode", (id, targetId, position) => {
    let player = mp.players.atRemoteId(id);
    if (!player)
        return;
    // if targetId is -1, disable spec.
    if (targetId === -1) {
        player.targetSpecId = null;
        stopSpec(player);
    }
    else {
        let target = mp.players.atRemoteId(targetId);
        if (!mp.players.exists(target))
            return;
        if (position && position.x !== 0 && position.y !== 0 && position.z !== 0) {
            startSpec(player, targetId, position);
        }
        else
            mp.console.logWarning(`cant spectate ${targetId} because initial position is null or (0, 0, 0).`);
    }
});
mp.events.add("render", () => {
    if (mp.players.local.targetSpecId != null) {
        let targetSpec = mp.players.atRemoteId(mp.players.local.targetSpecId);
        if (mp.players.exists(targetSpec)) {
            if (targetSpec.handle !== 0) {
                mp.players.local.setCoords(targetSpec.position.x, targetSpec.position.y, targetSpec.position.z, false, true, true, true);
                mp.game.invoke("0x8BBACBF51DA047A8", targetSpec.handle); // SET_GAMEPLAY_CAM_FOLLOW_PED_THIS_UPDATE(Ped ped);
            }
        }
    }
});
function startSpec(player, targetId, position) {
    player.freezePosition(true);
    player.setVisible(false, false);
    player.setCollision(false, false);
    player.setCoords(position.x, position.y, position.z, false, true, true, true);
    player.targetSpecId = targetId;
}
function stopSpec(player) {
    player.freezePosition(false);
    player.setInvincible(false);
    player.setVisible(true, true);
    player.setCollision(true, true);
}

}
player_spec.js
{
mp.events.add("entityStreamIn", (entity) => {
    if (entity.type === "player") {
        const props = entity.getVariable("props");
        if (props) {
            setProps(entity, props);
        }
    }
});
/* Sync of player props since we reached GTA:V prop limit */
mp.events.addDataHandler("props", (entity, value) => {
    if (entity.type === "player" && entity.handle) {
        setProps(entity, value);
    }
});
function setProps(player, props) {
    for (let i = 0; i < props.length; i++) {
        if (props[i][1] == -1) {
            player.clearProp(props[i][0]);
        }
        else {
            player.setPropIndex(props[i][0], props[i][1], props[i][2], false);
        }
    }
}

}
player_customization.js
{
let minigameBrowser = null;
let currentGame = null;
const nonStoppableGames = ["dance"];
var locale = "en";
mp.rpc("player:set_server_language", (lang) => {
    locale = lang;
});
//function startMinigame(type: string, data: string) { // @TODO: This was wrong! skillcheck, skillcheck-5, scratch-card, tamahubchi didn't receive the data but an undefined!
function startMinigame(type, dataJson) {
    let player = mp.players.local;
    destroyExistingMinigame();
    if (type.length === 0) {
        // if game is empty, win automatically
        mp.events.call("game:on_win");
        return;
    }
    switch (type.toLowerCase()) {
        case "dance":
            mp.danceGame(player, true);
            break;
        case "race":
            mp.raceGame(player, true);
            break;
        case "dummy":
            mp.dummyGame(player, true);
            break;
        case "skillcheck":
            mp.skillCheckGame(dataJson, locale);
            break;
        case "skillcheck-5":
            startSkillcheck5Game(dataJson);
            break;
        case "ouija":
            startOuija();
            break;
        case "scratch-card-random":
            startScratchGame(dataJson);
            break;
        case "tamahubchi":
            startVirtualPetGame(type, dataJson);
            break;
        default: {
            mp.openGame(`https://cdn.gtahub.gg/minigames/${locale}/${type}/index.html`);
            break;
        }
    }
    currentGame = type;
}
mp.events.add("player:start_minigame", startMinigame);
mp.rpc("player:start_game", startMinigame);
mp.rpc("player:stop_current_game", () => {
    if (currentGame == null)
        return;
    let player = mp.players.local;
    destroyExistingMinigame();
    switch (currentGame.toLowerCase()) {
        case "dance":
            mp.danceGame(player, false);
            break;
        case "race":
            mp.raceGame(player, false);
            break;
        case "dummy":
            mp.dummyGame(player, false);
            break;
    }
    currentGame = null;
});
function destroyExistingMinigame() {
    if (minigameBrowser) {
        minigameBrowser.destroy();
        minigameBrowser = null;
        mp.disableUI("game");
    }
}
mp.openGame = function (path, useCursor = true, tries = 0, maxTries = 5) {
    destroyExistingMinigame();
    mp.browsers.retryNew(path)
        .then((browser) => {
        minigameBrowser = browser;
        minigameBrowser.active = true;
        mp.enableUI("game", false, true, useCursor);
    })
        .catch((e) => {
        mp.console.logError(`Failed to open minigame: ${path}`);
        mp.events.callRemote("game:on_finish", "{}", false);
    });
};
/** Set the given variable for minigame. */
mp.gameSet = function (vm, variable, value) {
    let code = `${vm}.${variable}=${JSON.stringify(value)}`;
    minigameExecute(code);
};
function minigameExecute(code) {
    if (minigameBrowser) {
        minigameBrowser.execute(code);
    }
}
// called from games html
mp.events.add("game:on_win", () => {
    mp.events.callRemote("game:on_finish", JSON.stringify({}), true);
});
mp.events.add("game:on_fail", (points = null) => {
    if (points)
        points = JSON.stringify({ score: [points] });
    else
        points = JSON.stringify({});
    mp.events.callRemote("game:on_finish", points, false);
});
mp.events.add("game:execute_action", (action = "", data = "") => {
    if (data)
        data = JSON.stringify(data);
    mp.events.callRemote("game:execute_action", action, data);
});
function startOuija() {
    const playerName = mp.players.local.name.slice(0, mp.players.local.name.indexOf("_"));
    mp.openGame(`https://cdn.gtahub.gg/minigames/${locale}/ouija/index.html`, true);
    setTimeout(() => {
        mp.gameSet("appVM", "username", playerName);
    }, 1000);
}
function startScratchGame(_data) {
    try {
        const data = JSON.parse(_data);
        if (!data[0] || !data[1])
            throw new Error("Not valid data for scratch");
        const itemWinner = data[1]?.reward;
        const items = data[0];
        const array = [];
        for (let x = 0; x < 9; x++) {
            const shuffled = items.sort(function () {
                return Math.random() - 0.5;
            });
            for (let _item of shuffled) {
                let item = _item?.reward;
                if (!item)
                    continue;
                const last = shuffled.indexOf(_item) === shuffled.length - 1;
                if (array.filter(it => it.image === itemWinner.image).length < 3 && (item.image === itemWinner.image || x >= 6)) {
                    array.push({ image: itemWinner.image, name: itemWinner.name[locale] });
                    break;
                }
                else if (item.image !== itemWinner.image && array.filter(it => it.image === item.image).length < 2) {
                    array.push({ image: item.image, name: item.name[locale] });
                    break;
                }
                else if (last) {
                    array.push({ name: "?", image: "" });
                    break;
                }
            }
        }
        mp.openGame(`https://cdn.gtahub.gg/minigames/${locale}/scratch-card-random/index.html`, true);
        setTimeout(() => {
            minigameExecute(`scratchVM.setCard(${JSON.stringify([array, data[2]])})`);
        }, 3000);
    }
    catch (e) {
        mp.console.logWarning(`Cannot start scratch game: ${e}`);
    }
}
function startVirtualPetGame(type, _data) {
    const data = JSON.parse(_data);
    mp.openGame(`https://cdn.gtahub.gg/minigames/${locale}/${type}/index.html`, true);
    setTimeout(() => {
        minigameExecute(`virtualPetVM.setAttributes(${JSON.stringify(data)})`);
    }, 1000);
}
function startSkillcheck5Game(data) {
    try {
        mp.openGame(`https://cdn.gtahub.gg/minigames/${locale}/skillcheck-5/index.html`, false);
        setTimeout(() => {
            minigameExecute(`skillcheckVM.setAttributes(${data})`);
        }, 1000);
    }
    catch (e) {
        mp.console.logWarning(`cannot start skillcheck-5: ${e}`);
    }
}
function closeMinigame() {
    destroyExistingMinigame();
    mp.events.callRemote("game:on_finish", "{}", false);
}
mp.useInput(mp.input.CLOSE_MINIGAME_1, false, () => {
    if (currentGame == null || nonStoppableGames.includes(currentGame.toLowerCase()))
        return;
    closeMinigame();
});

}
games.js
{
/**
 * Joebill camera functions wrapper.
 * Also reports every few seconds camera front vector and camera.
 */
// TODO: probably files should be like:
let staticCam = null;
let staticCam2 = null;
let orbitCam = null;
let camFov = 42.4;
let drunkLevelSmooth = 0;
let drunkLevel = 0;
//let screenshotsTaked = 0;
mp.playerCamera = {
    gameplayCamera: mp.cameras.new("gameplay"),
    getActiveCamera: function () {
        return mp.players.local.activeCamera ? mp.players.local.activeCamera : this.gameplayCamera;
    }
};
let lastCameraPos = new mp.Vector3(0, 0, 0);
let lastCameraFront = new mp.Vector3(0, 0, 0);
mp.setInterval(() => {
    const camera = mp.playerCamera.getActiveCamera();
    const coords = camera.getCoord();
    const front = camera.getDirection();
    if (mp.game.system.vdist(coords.x, coords.y, coords.z, lastCameraPos.x, lastCameraPos.y, lastCameraPos.z) > 0.3 ||
        mp.game.system.vdist(front.x, front.y, front.z, lastCameraFront.x, lastCameraFront.y, lastCameraFront.z) > 0.05) {
        lastCameraPos = coords;
        lastCameraFront = front;
        mp.events.callRemote("camera:on_update", coords, front);
    }
}, 750);
function destroyExistingCameras() {
    if (staticCam != null) {
        staticCam.setActive(false);
        staticCam.destroy();
        staticCam = null;
    }
    if (staticCam2 != null) {
        staticCam2.setActive(false);
        staticCam2.destroy();
        staticCam2 = null;
    }
    if (orbitCam != null) {
        orbitCam.setActive(false);
        orbitCam.destroy();
        orbitCam = null;
    }
}
mp.rpc("camera:set", (posJson, lookAtJson, time) => {
    destroyExistingCameras();
    let pos = JSON.parse(posJson);
    let lookAt = JSON.parse(lookAtJson);
    staticCam = mp.cameras.new("camara", pos, new mp.Vector3(0, 0, 0), camFov);
    staticCam.pointAtCoord(lookAt.x, lookAt.y, lookAt.z);
    staticCam.setActive(true);
    staticCam.shake('HAND_SHAKE', 0.5);
    mp.game.cam.renderScriptCams(true, time !== 0, time, false, false);
    mp.players.local.activeCamera = staticCam;
});
mp.rpc("camera:set_to_rotation", (posJson, rotationJson, time) => {
    destroyExistingCameras();
    let pos = JSON.parse(posJson);
    let rotation = JSON.parse(rotationJson);
    staticCam = mp.cameras.new("camara", pos, new mp.Vector3(0, 0, 0), camFov);
    staticCam.setRot(rotation.x, rotation.y, rotation.z, 0);
    staticCam.setActive(true);
    mp.game.cam.renderScriptCams(true, time !== 0, time, false, false);
    mp.players.local.activeCamera = staticCam;
});
mp.rpc("camera:setBehind", (time) => {
    destroyExistingCameras();
    mp.players.local.activeCamera = null;
    mp.game.cam.renderScriptCams(false, time !== 0, time, true, true);
});
mp.rpc("camera:shake", (type, amplitude) => {
    if (drunkLevel === 0) {
        mp.game.cam.shakeGameplayCam(type, amplitude);
    }
});
mp.rpc("camera:set_drunk_level", (value) => {
    if (drunkLevel === 0 && value > 0) {
        setTimeout(() => {
            if (drunkLevel > 0) {
                mp.game.cam.shakeGameplayCam('DRUNK_SHAKE', 0.01);
            }
        }, 500);
    }
    drunkLevel = value * 3;
});
setInterval(() => {
    if (drunkLevel > drunkLevelSmooth) {
        drunkLevelSmooth += 2;
        if (drunkLevelSmooth > drunkLevel)
            drunkLevelSmooth = drunkLevel;
    }
    else if (drunkLevel < drunkLevelSmooth) {
        drunkLevelSmooth -= 2;
        if (drunkLevelSmooth < drunkLevel)
            drunkLevelSmooth = drunkLevel;
    }
    if (drunkLevel > 0) {
        drunkLevel--;
    }
    if (drunkLevel === 0 && drunkLevelSmooth > 0) {
        mp.game.cam.stopGameplayCamShaking(true);
        drunkLevelSmooth = 0;
    }
    if (drunkLevelSmooth > 0) {
        mp.game.cam.setGameplayCamShakeAmplitude(Math.min(drunkLevelSmooth / 100.0, 2.5));
    }
}, 333);
mp.rpc("camera:interpolate", (startPosJson, startLookAtJson, endPosJson, endLookAtJson, time) => {
    destroyExistingCameras();
    let startPos = JSON.parse(startPosJson);
    let startLookAt = JSON.parse(startLookAtJson);
    let endPos = JSON.parse(endPosJson);
    let endLookAt = JSON.parse(endLookAtJson);
    staticCam = mp.cameras.new("camara", startPos, new mp.Vector3(0, 0, 0), camFov);
    staticCam2 = mp.cameras.new("camara", endPos, new mp.Vector3(0, 0, 0), camFov);
    staticCam.pointAtCoord(startLookAt.x, startLookAt.y, startLookAt.z);
    staticCam2.pointAtCoord(endLookAt.x, endLookAt.y, endLookAt.z);
    staticCam2.setActiveWithInterp(staticCam.handle, time, 0, 0);
    mp.players.local.activeCamera = staticCam2;
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
});
mp.useInput(mp.input.TAKE_SCREENSHOT, true, async () => {
    setTimeout(() => {
        mp.browserCallSafe("Screenshots", "takeRequest");
    }, 1);
});
mp.events.addRequestResponse("client:take_screenshot", (fileName, type, quality, compQuality, fv) => {
    const start = Date.now();
    const resolution = mp.game.graphics.getScreenActiveResolution(100, 100);
    mp.gui.takeScreenshot(fileName, type, quality, compQuality);
    const end = Date.now();
    if (!fv)
        mp.game.audio.playSoundFrontend(-1, "Camera_Shoot", "Phone_Soundset_Franklin", true);
    if (!fv)
        console.log(`client:take_screenshot: ${fileName}`, true, true);
    if (fv) {
        return { fileName: fileName, time: end - start, width: 1100, height: 600 };
    }
    else {
        return { fileName: fileName, time: end - start, width: resolution.x, height: resolution.y };
    }
});
// Handler for admin screenshot
mp.rpc("client:take_screenshot_fv", async (callViewId) => {
    try {
        mp.browserCallSafe("Screenshots", "takeRequestFv", callViewId);
    }
    catch (e) { /* Intentional empty catch */ }
});
let orbitState = {
    isActive: false,
    targetPoint: new mp.Vector3(0, 0, 0),
    distance: 10.0,
    pitch: 0.0,
    yaw: 0.0,
    minDistance: 2.0,
    maxDistance: 50.0,
    sensitivity: 2.0,
    zoomSensitivity: 2.0,
    limitPitch: false,
};
let isDragging = false;
let lastCursorPos = null;
let currentResolution = mp.game.graphics.getScreenActiveResolution(0, 0);
function cartesianToOrbit(camera, target) {
    const dx = camera.x - target.x;
    const dy = camera.y - target.y;
    const dz = camera.z - target.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const yaw = Math.atan2(dy, dx);
    let pitch = Math.asin(dz / distance);
    pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
    return { distance, pitch, yaw };
}
function calculateOrbitCameraPosition() {
    const x = orbitState.targetPoint.x + orbitState.distance * Math.cos(orbitState.yaw) * Math.cos(orbitState.pitch);
    const y = orbitState.targetPoint.y + orbitState.distance * Math.sin(orbitState.yaw) * Math.cos(orbitState.pitch);
    const z = orbitState.targetPoint.z + orbitState.distance * Math.sin(orbitState.pitch);
    return new mp.Vector3(x, y, z);
}
function updateOrbitCamera() {
    if (!orbitCam || !orbitState.isActive)
        return;
    const cameraPos = calculateOrbitCameraPosition();
    orbitCam.setCoord(cameraPos.x, cameraPos.y, cameraPos.z);
    orbitCam.pointAtCoord(orbitState.targetPoint.x, orbitState.targetPoint.y, orbitState.targetPoint.z);
}
// Orbit camera RPC handlers
mp.rpc("camera:orbit_activate", (initialPosition, targetPosition, maxDistance, limitPitch) => {
    try {
        destroyExistingCameras();
        orbitState.targetPoint = new mp.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
        const { distance, pitch, yaw } = cartesianToOrbit(initialPosition, targetPosition);
        orbitState.maxDistance = maxDistance;
        orbitState.distance = distance;
        orbitState.pitch = pitch;
        orbitState.yaw = yaw;
        orbitState.isActive = true;
        orbitState.limitPitch = limitPitch;
        const initialPos = calculateOrbitCameraPosition();
        orbitCam = mp.cameras.new("orbit_camera", initialPos, new mp.Vector3(0, 0, 0), camFov);
        orbitCam.pointAtCoord(orbitState.targetPoint.x, orbitState.targetPoint.y, orbitState.targetPoint.z);
        orbitCam.setActive(true);
        mp.players.local.activeCamera = orbitCam;
        mp.game.cam.renderScriptCams(true, false, 0, false, false);
    }
    catch (error) {
        mp.console.logError("Failed to activate orbit camera:", error);
    }
});
mp.rpc("camera:orbit_deactivate", () => {
    orbitState.isActive = false;
    isDragging = false;
    lastCursorPos = null;
    if (orbitCam) {
        orbitCam.setActive(false);
        orbitCam.destroy();
        orbitCam = null;
    }
    mp.players.local.activeCamera = null;
    mp.game.cam.renderScriptCams(false, false, 0, true, true);
});
// Handle scroll for orbit camera zooming
mp.events.add("entityrotation:on_scroll", (isUp) => {
    if (!orbitState.isActive)
        return;
    // Dynamic zoom sensitivity based on distance
    const minDist = orbitState.minDistance;
    const distanceFactor = (orbitState.distance - minDist) / (orbitState.maxDistance - minDist); // 0.0 to 1.0
    const dynamicZoomSensitivity = orbitState.zoomSensitivity * (0.5 + distanceFactor * 1.5); // 0.5x to 2.0x base sensitivity
    const zoomDelta = isUp ? -dynamicZoomSensitivity : dynamicZoomSensitivity;
    orbitState.distance = Math.max(orbitState.minDistance, Math.min(orbitState.maxDistance, orbitState.distance + zoomDelta));
    updateOrbitCamera();
});
mp.events.add("click", (x, y, upOrDown, leftOrRight, relativeX, relativeY, worldPosition, hitEntity) => {
    if (!orbitState.isActive)
        return;
    if (leftOrRight === "left") {
        if (upOrDown === "down") {
            isDragging = true;
            lastCursorPos = [x, y];
        }
        else if (upOrDown === "up") {
            isDragging = false;
            lastCursorPos = null;
        }
    }
});
// Handle mouse movement for orbit camera rotation
mp.events.add("render", () => {
    if (!orbitState.isActive || !isDragging || !lastCursorPos)
        return;
    const currentCursorPos = mp.gui.cursor.position;
    if (!currentCursorPos)
        return;
    currentResolution = mp.game.graphics.getScreenActiveResolution(0, 0);
    const deltaX = (currentCursorPos[0] - lastCursorPos[0]) / currentResolution.x;
    const deltaY = (currentCursorPos[1] - lastCursorPos[1]) / currentResolution.y;
    orbitState.yaw -= deltaX * orbitState.sensitivity;
    orbitState.pitch += deltaY * orbitState.sensitivity;
    const maxPitch = orbitState.limitPitch ? 0 : -Math.PI / 2 + 0.1;
    orbitState.pitch = Math.max(maxPitch, Math.min(Math.PI / 2 - 0.1, orbitState.pitch));
    lastCursorPos = currentCursorPos;
    updateOrbitCamera();
});

}
{
/**
 * Implements the ability to register an 'attachment key', which is a string that contains
 * information about an attachment: its model, bone, and offsets.
 */
let attachmentKeys = {}; // Maps for every key the attachment data.
let objectsList = []; // List for all attachment objects to iterate.
let deferred = true; // Set deferred when stream out
/** Register a new attachment key. */
mp.rpc("player:register_attachment", (key, model, bone, offset, rotation) => {
    if (!mp.game.streaming.isModelInCdimage(model)) {
        //mp.console.logError(`Model ${model} not in cd image. Don't register.`);
        return;
    }
    attachmentKeys[key] = { model: model, bone: bone, offset: offset, rotation: rotation };
});
mp.rpc("player:register_packaged_attachments", (attachments) => {
    for (const [key, hash, bone, offset, rotation] of attachments) {
        if (!mp.game.streaming.isModelInCdimage(hash)) {
            continue;
        }
        attachmentKeys[key] = { model: hash, bone: bone, offset: offset, rotation: rotation };
    }
});
/** Set the attachments of the given player */
mp.rpc("player:set_attachments", (playerId, keyListJSON) => {
    let player = mp.players.atRemoteId(playerId);
    if (!player)
        return;
    let keys = JSON.parse(keyListJSON);
    // if the player is streamed on the client, attach the items
    player.attachmentKeys = keys;
    if (player.handle) {
        player.syncAttachments = true;
        checkDistanceForAttachments(player);
    }
});
mp.rpc("player:set_attachments_deferred", (setDeferred) => {
    deferred = setDeferred;
});
let totalAttachments = 0;
let maxAttachments = 100;
mp.getTotalPlayerAttachments = () => { return totalAttachments; };
mp.setMaxPlayerAttachments = (max) => { maxAttachments = max; };
/** Sync attachments. */
function syncAttachmentObjects(player, keys, deferred, source) {
    // Create a set of keys for quick lookup
    const keySet = new Set(keys);
    // Destroy attachments that are no longer needed (do not appear in the new key set)
    const currentAttachments = player.attachmentObjects || {};
    const reusableAttachments = [];
    for (let k in currentAttachments) {
        if (keySet.has(k)) {
            reusableAttachments.push(currentAttachments[k]);
            keySet.delete(k);
            continue;
        }
        let obj = currentAttachments[k];
        if (mp.objects.exists(obj)) {
            let objIndex = objectsList.indexOf(obj);
            if (!deferred) {
                obj.destroy();
                totalAttachments--;
                if (objIndex !== -1) {
                    objectsList.splice(objIndex, 1);
                }
            }
            else {
                if (obj.isAttached()) {
                    obj.setCollision(false, false);
                    obj.detach(false, false);
                }
                obj.deferredDestroy = true;
                if (objIndex === -1) {
                    objectsList.push(obj);
                }
            }
        }
    }
    player.attachmentObjects = reusableAttachments;
    if (keySet.size > 0) {
        // Calculate a position below ground so it's invisible to players.
        let pos = mp.players.local.position;
        pos.z -= 15;
        // Create new attachments
        for (let k of keys) {
            if (totalAttachments >= maxAttachments) {
                break;
            }
            let keyData = attachmentKeys[k];
            if (keyData) {
                // create the object. as soon as it streams, will be attached to the corresponding player.
                let obj = mp.objects.new(keyData.model, pos, { dimension: -1 });
                if (obj) {
                    obj.checkForStream = true;
                    obj.shouldAttachToPlayer = player;
                    obj.shouldAttachKeyData = keyData;
                    obj.oldHandle = 0;
                    player.attachmentObjects[k] = obj;
                    objectsList.push(obj);
                    totalAttachments++;
                }
                else {
                    mp.console.logWarning(`syncAttachments - can't create obj.`);
                }
            }
        }
    }
}
function isOnScreen(pos) {
    const r = mp.game.graphics.world3dToScreen2d(pos.x, pos.y, pos.z);
    return r !== undefined;
}
let blockAttachmentsBones = new Set();
const attachmentsOnFootRenderDistance = 35;
function checkDistanceForAttachments(player) {
    let localPos = mp.players.local.position;
    let playerPos = player.position;
    let distance = mp.game.system.vdist(localPos.x, localPos.y, localPos.z, playerPos.x, playerPos.y, playerPos.z);
    const onScreen = player.handle ? isOnScreen(player.position) : false;
    if (onScreen && ((distance <= attachmentsOnFootRenderDistance && player.syncAttachments && !player.vehicle) || (distance <= 10 && player.syncAttachments && player.vehicle))) {
        player.syncAttachments = false;
        // re-attach objects the player had attached
        let keys = player.attachmentKeys;
        if (keys) {
            if (blockAttachmentsBones.size > 0) {
                keys = keys.filter(k => {
                    const kd = attachmentKeys[String(k)];
                    return !kd || !blockAttachmentsBones.has(kd.bone);
                });
            }
            syncAttachmentObjects(player, keys, deferred);
        }
    }
    else if ((distance > attachmentsOnFootRenderDistance || !onScreen) && !player.syncAttachments) {
        player.syncAttachments = true;
        let attachmentObjects = player.attachmentObjects;
        if (attachmentObjects) {
            syncAttachmentObjects(player, [], deferred);
        }
    }
}
// If entity is the object that was just created, attach to the corresponding player.
mp.events.add("objectHandleChange", (entity) => {
    if (entity.handle && entity.type === "object" && entity.shouldAttachToPlayer) {
        let player = entity.shouldAttachToPlayer;
        let key = entity.shouldAttachKeyData;
        // make sure player still exists and is streamed.
        if (mp.players.exists(player) && player.handle && key) {
            entity.attachTo(player.handle, player.getBoneIndex(key.bone), key.offset.x, key.offset.y, key.offset.z, key.rotation.x, key.rotation.y, key.rotation.z, false, false, false, false, 2, true);
        }
    }
});
mp.setInterval(() => {
    // Use a reverse loop to safely remove items while iterating
    for (let i = objectsList.length - 1; i >= 0; i--) {
        let obj = objectsList[i];
        if (mp.objects.exists(obj)) {
            if (obj.deferredDestroy) {
                obj.destroy();
                totalAttachments--;
                objectsList.splice(i, 1);
            }
            else if (obj.checkForStream) {
                let oldHandle = obj.oldHandle;
                let handle = obj.handle;
                if (oldHandle !== handle) {
                    mp.events.call("objectHandleChange", obj);
                    obj.oldHandle = handle;
                }
            }
        }
        else {
            // Remove non-existent objects from the list
            objectsList.splice(i, 1);
        }
    }
}, 50);
mp.setInterval(() => {
    mp.players.forEachInStreamRange(player => {
        if (!mp.players.exists(player) || !player.handle)
            return;
        checkDistanceForAttachments(player);
    });
}, 500);
// Set player to check position distance from localPlayer to attach keys
mp.events.add("entityStreamIn", (entity) => {
    if (entity.type === "player") {
        entity.syncAttachments = true;
    }
});
// Destroy attached objects on stream out
mp.events.add("entityStreamOut", (entity) => {
    if (entity.type === "player") {
        let attachmentObjects = entity.attachmentObjects;
        if (attachmentObjects) {
            syncAttachmentObjects(entity, [], deferred);
        }
    }
});
mp.rpc("player:block_attachments_bones", (playerId, bones) => {
    let player = mp.players.atRemoteId(playerId);
    if (!player)
        return;
    const list = Array.isArray(bones?.[0]) ? bones.map((b) => b[0]) : (bones ?? []);
    blockAttachmentsBones = new Set(list);
    if (player.handle) {
        player.syncAttachments = true;
        checkDistanceForAttachments(player);
    }
});

}
{
/** Dance variables */
const KEYS_HEADING = [
    0, // RIGHT ARROW
    90, // DOWN ARROW
    180, // LEFT ARROW
];
let keysSprites = [];
let danceGameActive = false;
let lastFrame = 0;
let lastColor = 0;
let lightColor = {
    r: 0,
    g: 0,
    b: 0
};
let startPlaying = 0;
let points = 0;
let totalNotes = 0;
let pressedNotes = 0;
let showPoints = [];
const ARROW_SPRITE = "mp_arrowlarge";
const DANCE_PLAYTIME = 1000 * 60;
const COLOR_POINTS = [
    [0, 104, 255, 200],
    [236, 255, 0, 200],
    [223, 234, 83, 200],
    [186, 189, 157, 200]
];
let gamedance_translations = {};
mp.game.graphics.requestStreamedTextureDict("mparrow", true);
mp.game.graphics.requestStreamedTextureDict("visualflow", true);
mp.game.graphics.requestStreamedTextureDict("timerbars", true);
mp.danceGame = function (player, start = true) {
    if (start) {
        mp.startTimer(5);
        setTimeout(() => {
            points = 0;
            startPlaying = Date.now();
            danceGameActive = true;
            player.freezePosition(true);
        }, 5000);
    }
    else {
        danceGameActive = false;
        mp.players.local.freezePosition(false);
        let finishObj = {
            score: [points, totalNotes, pressedNotes]
        };
        mp.events.callRemote("game:on_finish", JSON.stringify(finishObj), false);
        points = 0;
        totalNotes = 0;
        pressedNotes = 0;
    }
};
mp.setInterval(() => {
    if (danceGameActive) {
        if (Date.now() - startPlaying >= DANCE_PLAYTIME) {
            mp.danceGame(mp.players.local, false);
        }
        else {
            keyGenerator();
        }
        if (showPoints.length !== 0) {
            showPoints.splice(0, 1); // delete the first element every 1.750s
        }
    }
}, 1750);
mp.events.add("render", () => {
    if (danceGameActive) {
        moveKeys(lastFrame);
        // create hud with game information
        let alpha = isArrowPressed() ? 255 : 55;
        mp.game.graphics.drawSprite("visualflow", "crosshair", 0.5, 0.8, 0.04, 0.05, 0, 255, 255, 255, alpha);
        mp.game.graphics.drawSprite("timerbars", "all_black_bg", 0.95, 0.97, 0.12, 0.04, 0, 0, 0, 0, 255);
        mp.game.graphics.drawText(`${gamedance_translations['score']} ` + points, [0.96, 0.95], {
            font: 4,
            color: [255, 255, 255, 255],
            scale: [0.5, 0.5],
            outline: true
        });
        // points when press key
        showPoints.forEach((point, index) => {
            let color;
            if (point === 300)
                color = COLOR_POINTS[0];
            else if (point === 200)
                color = COLOR_POINTS[1];
            else if (point === 100)
                color = COLOR_POINTS[2];
            else
                color = COLOR_POINTS[3];
            mp.game.graphics.drawText("+" + point, [0.5 + index / 100, 0.83 + index / 100], {
                font: 4,
                color: color,
                scale: [0.35, 0.35],
                outline: true
            });
        });
        // light at head of the player, change every 10 seconds
        if (Date.now() - lastColor > 1000) {
            lastColor = Date.now();
            lightColor = getRandomColor(false);
        }
        let pos = mp.players.local.position;
        mp.game.graphics.drawSpotLight(pos.x, pos.y, pos.z + 10, 0, 0, -1, lightColor.r, lightColor.g, lightColor.b, 20, 70, 5, 10, 1);
        // set last frame time
        lastFrame = Date.now();
    }
});
mp.useInput(mp.input.PUZZLE_DOWN, true, function () {
    if (danceGameActive)
        checkArrow(1);
});
mp.useInput(mp.input.PUZZLE_LEFT, true, function () {
    if (danceGameActive)
        checkArrow(2);
});
mp.useInput(mp.input.PUZZLE_RIGHT, true, function () {
    if (danceGameActive)
        checkArrow(0);
});
mp.rpc("player:set_server_language", (lang) => {
    gamedance_translations = mp.getTranslations(['score'], lang);
});
function checkArrow(arrowInt) {
    keysSprites.forEach((key) => {
        if (key[0] < 0.6 && key[0] >= 0.5 && key[5] === 255) {
            if (arrowInt === key[6]) {
                key[5] = 55;
                let accuracy = key[0] - 0.5;
                if (accuracy <= 0.01)
                    updateScore(300); // excellent
                else if (accuracy <= 0.025)
                    updateScore(200); // very good
                else if (accuracy <= 0.035)
                    updateScore(100); // good
                else if (accuracy <= 0.05)
                    updateScore(50); // bad
                pressedNotes++;
            }
        }
    });
}
function updateScore(score) {
    points += score;
    showPoints.push(score);
    if (score === 300)
        mp.game.audio.playSoundFrontend(-1, "TENNIS_MATCH_POINT", "HUD_AWARDS", true);
    else
        mp.game.audio.playSoundFrontend(-1, "GOLF_BIRDIE", "HUD_AWARDS", true);
    let pointsObj = {
        score: [points]
    };
    mp.events.callRemote("game:on_update", JSON.stringify(pointsObj));
}
function moveKeys(lastFrame) {
    if (danceGameActive) {
        keysSprites.forEach((key, index) => {
            if (Date.now() - lastFrame < 150) {
                let playingTime = Date.now() - startPlaying;
                if (playingTime < 15000)
                    key[0] -= 0.001;
                else if (playingTime >= 15000 && playingTime < 30000)
                    key[0] -= 0.0015;
                else if (playingTime >= 30000)
                    key[0] -= 0.0025;
            }
            if (key[0] < 0.5 && key[5] !== 55)
                key[5] = 55;
            if (key[0] < 0)
                keysSprites.splice(index, 1);
            mp.game.graphics.drawSprite("mparrow", ARROW_SPRITE, key[0], 0.8, 0.03, 0.045, key[1], (key[2]) | 0, (key[3]) | 0, (key[4]) | 0, (key[5] | 0));
        });
    }
}
function keyGenerator() {
    if (danceGameActive) {
        totalNotes++;
        let getRandomKey = randomKey();
        let color = getRandomColor();
        let key = [0.9, KEYS_HEADING[getRandomKey], color.r, color.g, color.b, color.a, getRandomKey];
        keysSprites.push(key);
    }
}
function getRandomColor(moreGreen = true) {
    if (moreGreen) {
        return {
            r: getRandomInt(0, 256 / 2),
            g: getRandomInt(100, 256),
            b: getRandomInt(0, 256 / 2),
            a: 255,
        };
    }
    else {
        return {
            r: getRandomInt(0, 256),
            g: getRandomInt(0, 256),
            b: getRandomInt(0, 256),
            a: 255,
        };
    }
}
function randomKey() {
    return getRandomInt(0, 3);
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function isArrowPressed() {
    if (mp.game.controls.isControlPressed(3, 173) || mp.game.controls.isControlPressed(3, 174) || mp.game.controls.isControlPressed(3, 175))
        return true;
    else
        return false;
}

}
game_dance.js
{
/** Race variables */
let raceGameActive = false;
mp.raceGame = function (player, start = true) {
    if (start) {
        mp.startTimer(5);
        setTimeout(() => {
            raceGameActive = true;
        }, 5000);
    }
    else {
        raceGameActive = false;
    }
};

}
game_race.js
{
let dummyGameActive = false;
let win = false;
mp.dummyGame = function (player, start) {
    dummyGameActive = start;
};
mp.useInput(mp.input.PUZZLE_LEFT, true, function () {
    if (dummyGameActive) {
        win = true;
        mp.events.callRemote("game:on_finish", JSON.stringify({}), win);
    }
});
mp.useInput(mp.input.PUZZLE_RIGHT, true, function () {
    if (dummyGameActive) {
        win = false;
        mp.events.callRemote("game:on_finish", JSON.stringify({}), win);
    }
});

}
game_dummy.js
{
mp.events.add("game_skillcheck:on_show", () => {
    mp.game.audio.playSoundFrontend(-1, "ROUND_ENDING_STINGER_CUSTOM", "CELEBRATION_SOUNDSET", true);
});
mp.events.add("game_skillcheck:on_finish", (success) => {
    if (success)
        mp.game.audio.playSoundFrontend(-1, "Hit_In", "PLAYER_SWITCH_CUSTOM_SOUNDSET", true);
    else
        mp.game.audio.playSoundFrontend(-1, "ERROR", "HUD_AMMO_SHOP_SOUNDSET", true);
});
mp.skillCheckGame = function (_data, locale) {
    mp.openGame(`https://cdn.gtahub.gg/minigames/${locale}/skillcheck/index.html`, false);
    if (_data !== "null") {
        try {
            const data = JSON.parse(_data);
            if (typeof data.timesToComplete === "number") {
                setTimeout(() => {
                    mp.gameSet("skillcheckVM", "timesToComplete", data.timesToComplete);
                }, 1000);
            }
        }
        catch (e) {
            mp.console.logWarning(`cannot start skillcheck: ${e}`);
        }
    }
};

}
game_skillcheck.js
{
let garajeLoaded = false;
mp.setInterval(() => {
    let pos = mp.players.local.position;
    let interiorId = mp.game.interior.getInteriorAtCoords(pos.x, pos.y, pos.z);
    if (interiorId === 285697 && !garajeLoaded) {
        garajeLoaded = true;
        mp.game.streaming.requestIpl("tr_int_placement_tr_interior_1_tuner_car_meetmilo");
        mp.game.interior.enableInteriorProp(285697, "entity_set_meet_lights_cheap");
        mp.game.interior.enableInteriorProp(285697, "entity_set_meet_lights");
        mp.game.interior.enableInteriorProp(285697, "entity_set_meet_crew");
        mp.game.interior.enableInteriorProp(285697, "entity_set_test_crew");
        mp.game.interior.enableInteriorProp(285697, "entity_set_test_lights");
        mp.game.interior.enableInteriorProp(285697, "entity_set_test_lights_cheap");
        mp.game.interior.refreshInterior(285697);
    }
}, 1000);

}
garajerace.js
cayoperico.js
{
let vespLoaded = false;
function loadVesp() {
    mp.game.streaming.requestIpl('int_vesp_01_1_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_01_1");
    mp.game.streaming.removeIpl("vesp_lod_01_1");
    mp.game.streaming.requestIpl('int_vesp_01_2_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_01_2");
    mp.game.streaming.requestIpl('int_vesp_02_1_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_02_1");
    mp.game.streaming.requestIpl('int_vesp_02_2_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_02_2");
    mp.game.streaming.requestIpl('int_vesp_03_1_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_03_1");
    mp.game.streaming.removeIpl("vesp_lod_03_1");
    // load in 4 parts to avoid some crashes (normally in first spawn on mlo)
    setTimeout(loadVesp2, 250);
    setTimeout(loadVesp3, 500);
    setTimeout(loadVesp4, 750);
}
function loadVesp2() {
    mp.game.streaming.requestIpl('int_vesp_2_1_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_2_1");
    mp.game.streaming.removeIpl("vesp_lod_2_1");
    mp.game.streaming.requestIpl('int_vesp_3_1_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_3_1");
    mp.game.streaming.removeIpl("vesp_lod_3_1");
    mp.game.streaming.requestIpl('int_vesp_3_2_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_3_2");
    mp.game.streaming.removeIpl("vesp_lod_3_2");
    mp.game.streaming.requestIpl('int_vesp_4_2_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_4_2");
    mp.game.streaming.removeIpl("vesp_lod_4_2");
    mp.game.streaming.requestIpl('int_vesp_5_2_milo_');
    mp.game.streaming.removeIpl("vesp_ipl_5_2");
    mp.game.streaming.removeIpl("vesp_lod_5_2");
}
function loadVesp3() {
    mp.game.streaming.requestIpl("int_vesp_1_1_milo_");
    mp.game.streaming.requestIpl("int_vesp_1_2_milo_");
    mp.game.streaming.requestIpl("int_vesp_big_lift_milo_");
    mp.game.streaming.requestIpl("int_vesp_big_stair_milo_");
    mp.game.streaming.requestIpl("int_vesp_slift_milo_");
    mp.game.streaming.requestIpl("int_vesp_smole_stair_milo_");
}
function loadVesp4() {
    let vesp2_1ipl = mp.game.interior.getInteriorAtCoordsWithType(-1096.445, -831.962, 23.033, "int_vesp_1_2");
    let vesp3_1ipl = mp.game.interior.getInteriorAtCoordsWithType(-1091.963, -831.206, 26.827, "int_vesp_3_2");
    let vesp02_2ipl = mp.game.interior.getInteriorAtCoordsWithType(-1095.002, -838.586, 10.276, "int_vesp_02_1");
    let vesp02_1ipl = mp.game.interior.getInteriorAtCoordsWithType(-1095.002, -838.586, 10.276, "int_vesp_02_2");
    let vesp01_2ipl = mp.game.interior.getInteriorAtCoordsWithType(-1088.377, -832.352, 5.479, "int_vesp_01_1");
    let vesp01_1ipl = mp.game.interior.getInteriorAtCoordsWithType(-1097.205, -839.141, 4.878, "int_vesp_01_2");
    mp.game.interior.disableInteriorProp(vesp2_1ipl, "vesp1_2");
    mp.game.interior.disableInteriorProp(vesp3_1ipl, "vesp3_2");
    mp.game.interior.disableInteriorProp(vesp02_2ipl, "vesp02_1");
    mp.game.interior.disableInteriorProp(vesp02_1ipl, "vesp02_2");
    mp.game.interior.disableInteriorProp(vesp01_2ipl, "vesp01_1");
    mp.game.interior.disableInteriorProp(vesp01_1ipl, "vesp01_2");
    mp.game.interior.refreshInterior(vesp2_1ipl);
    mp.game.interior.refreshInterior(vesp3_1ipl);
    mp.game.interior.refreshInterior(vesp02_2ipl);
    mp.game.interior.refreshInterior(vesp02_1ipl);
    mp.game.interior.refreshInterior(vesp01_2ipl);
    mp.game.interior.refreshInterior(vesp01_1ipl);
}
function unloadVesp() {
    mp.game.streaming.removeIpl('int_vesp_01_1_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_01_1");
    mp.game.streaming.requestIpl("vesp_lod_01_1");
    mp.game.streaming.removeIpl('int_vesp_01_2_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_01_2");
    mp.game.streaming.removeIpl('int_vesp_02_1_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_02_1");
    mp.game.streaming.removeIpl('int_vesp_02_2_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_02_2");
    mp.game.streaming.removeIpl('int_vesp_03_1_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_03_1");
    mp.game.streaming.requestIpl("vesp_lod_03_1");
    mp.game.streaming.removeIpl('int_vesp_2_1_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_2_1");
    mp.game.streaming.requestIpl("vesp_lod_2_1");
    mp.game.streaming.removeIpl('int_vesp_3_1_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_3_1");
    mp.game.streaming.requestIpl("vesp_lod_3_1");
    mp.game.streaming.removeIpl('int_vesp_3_2_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_3_2");
    mp.game.streaming.requestIpl("vesp_lod_3_2");
    mp.game.streaming.removeIpl('int_vesp_4_2_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_4_2");
    mp.game.streaming.requestIpl("vesp_lod_4_2");
    mp.game.streaming.removeIpl('int_vesp_5_2_milo_');
    mp.game.streaming.requestIpl("vesp_ipl_5_2");
    mp.game.streaming.requestIpl("vesp_lod_5_2");
    mp.game.streaming.removeIpl("int_vesp_1_1_milo_");
    mp.game.streaming.removeIpl("int_vesp_1_2_milo_");
    mp.game.streaming.removeIpl("int_vesp_big_lift_milo_");
    mp.game.streaming.removeIpl("int_vesp_big_stair_milo_");
    mp.game.streaming.removeIpl("int_vesp_slift_milo_");
    mp.game.streaming.requestIpl("int_vesp_smole_stair_milo_");
}
function vespController() {
    let vespPos = new mp.Vector3(-1096.445, -831.962, 23.033);
    let playerPos = mp.players.local.position;
    let dist = mp.game.system.vdist(vespPos.x, vespPos.y, vespPos.z, playerPos.x, playerPos.y, playerPos.z);
    if (dist > 200 && vespLoaded) {
        if (mp.profiler.enabled)
            mp.console.logInfo(`[${mp.getCurrentTime()}-IPL]:  Unloading vespucci...`);
        unloadVesp();
        vespLoaded = false;
    }
    else if (dist < 200 && !vespLoaded) {
        if (mp.profiler.enabled)
            mp.console.logInfo(`[${mp.getCurrentTime()}-IPL]:  Loading vespucci...`);
        loadVesp();
        vespLoaded = true;
    }
}
mp.getCurrentTime = function () {
    const date = new Date();
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};
mp.setInterval(() => {
    vespController();
}, 1000);

}
vespucci_pd.js
{
let enabled = false;
let renderTarget = null;
let isNearCasino = false;
const targetName = "casinoscreen_01";
const textureDict = "Prop_Screen_Vinewood";
mp.rpc("casino:enable_wall", async (screen) => {
    mp.game.graphics.requestStreamedTextureDict(textureDict, false);
    while (!mp.game.graphics.hasStreamedTextureDictLoaded(textureDict)) {
        await mp.game.waitAsync(100);
    }
    mp.game.ui.registerNamedRendertarget(targetName, false);
    mp.game.ui.linkNamedRendertarget(mp.game.joaat('vw_vwint01_video_overlay'));
    //  SET_TV_CHANNEL_PLAYLIST
    mp.game.invoke("0xF7B38B8305F1FE8B", 0, screen, true);
    mp.game.graphics.setTvAudioFrontend(true);
    mp.game.graphics.setTvVolume(-100);
    mp.game.graphics.setTvChannel(0);
    renderTarget = mp.game.ui.getNamedRendertargetRenderId(targetName);
    enabled = true;
});
mp.rpc("casino:disable_wall", () => {
    mp.game.ui.releaseNamedRendertarget(renderTarget.toString());
    mp.game.ui.isNamedRendertargetRegistered(targetName);
    mp.game.graphics.setStreamedTextureDictAsNoLongerNeeded(textureDict);
    mp.game.graphics.setTvChannel(-1);
});
mp.events.add('render', function () {
    if (enabled) {
        mp.game.ui.setTextRenderId(renderTarget);
        mp.game.invoke("0x61BB1D9B3A95D802", 4); //  SET_SCRIPT_GFX_DRAW_ORDER
        mp.game.invoke("0xC6372ECD45D73BCD", true); //  SET_SCRIPT_GFX_DRAW_BEHIND_PAUSEMENU
        //  _DRAW_INTERACTIVE_SPRITE
        mp.game.invoke('0x2BC54A8188768488', textureDict, "BG_Wall_Colour_4x4", 0.25, 0.5, 0.5, 1.0, 0.0, 255, 255, 255, 255);
        mp.game.graphics.drawTvChannel(0.5, 0.5, 1.0, 1.0, 0.0, 255, 255, 255, 255);
        mp.game.ui.setTextRenderId(1);
    }
});
mp.setInterval(() => {
    if (!isNearCasino) {
        const pos = mp.players.local.position;
        if (pos.x >= 1491 && pos.y <= -3300) {
            mp.events.call('casino:disable_wall');
            isNearCasino = true;
        }
    }
    else {
        const pos = mp.players.local.position;
        if (pos.x < 1491 || pos.y > -3300) {
            mp.events.call('casino:disable_wall');
            isNearCasino = false;
        }
    }
}, 2000);

}
casino_walls.js
casino_inside_track.js
casino_roulette.js
{
System.register([], function (exports_1, context_1) {
    "use strict";
    var FLY_ANTICHEAT_CONFIG, flyViolations, vertSpeed, ANTI_COLLISION_ANTICHEAT_CONFIG, prevPosition, collisionViolation, lastCollisionViolation;
    var __moduleName = context_1 && context_1.id;
    function isAircraft(model) {
        return mp.game.vehicle.isThisModelAHeli(model) ||
            mp.game.vehicle.isThisModelAPlane(model);
    }
    function getGround(pos) {
        const waterHeight = mp.game.water.getWaterHeight(pos.x, pos.y, pos.z);
        if (waterHeight > 0)
            return waterHeight;
        return mp.game.gameplay.getGroundZFor3dCoord(pos.x, pos.y, pos.z, false, false);
    }
    function performFlyDetection(player) {
        if (!player.vehicle || isAircraft(player.vehicle.model))
            return;
        try {
            const pos = player.vehicle.position;
            const groundZ = getGround(pos);
            if (groundZ === 0)
                return;
            const height = pos.z - groundZ;
            const previousVertSpeed = vertSpeed;
            vertSpeed = player.vehicle.getVelocity().z;
            if (vertSpeed >= 0 && height > FLY_ANTICHEAT_CONFIG.hoveringThreshold) {
                if (height > FLY_ANTICHEAT_CONFIG.heightThreshold) { // Flying without falling
                    flyViolations++;
                }
                else if (vertSpeed >= previousVertSpeed) { // Ascending or hovering
                    flyViolations += 0.5;
                }
            }
            if (flyViolations > FLY_ANTICHEAT_CONFIG.violationThreshold) {
                const reason = `seems to be using fly hack (${flyViolations} violations)`;
                mp.events.originalCallRemote('reportVehicleCheat', "FLY_HACK_VEHICLE", reason);
                flyViolations = 0;
            }
        }
        catch (error) {
            console.error('Anti-fly anti-cheat error:', error);
        }
    }
    function performAntiCollisionDetection(player) {
        if (!ANTI_COLLISION_ANTICHEAT_CONFIG.enabled)
            return;
        if (!player.vehicle)
            return;
        const pos = player.vehicle.position;
        if (prevPosition && prevPosition != pos) {
            const collisionDisabled = mp.game.entity.getCollisionDisabled(player.vehicle.handle);
            if (collisionDisabled) {
                increaseCollisionViolation(0.25);
            }
            /* // could result in false positives, so disabled for now
            else {
                const flags = 31 // 1 + 2 + 4 + 8 + 16 (exclude vegetation)
                let raycast = mp.raycasting.testPointToPoint(pos, prevPosition, player.vehicle.handle, flags);
                if (raycast && raycast.position) {
                    const collisionDist = getDistance(pos, raycast.position);
                    const displacement = getDistance(pos, prevPosition);
                    if (collisionDist < displacement) {
                        increaseCollisionViolation();
                    }
                }
             }
            */
        }
        prevPosition = pos;
        if (collisionViolation >= ANTI_COLLISION_ANTICHEAT_CONFIG.violationThreshold) {
            const reason = `seems to be using anti-collision cheat (${collisionViolation} violations in ${ANTI_COLLISION_ANTICHEAT_CONFIG.resetDetectionsAfter / 60000} minutes)`;
            mp.events.originalCallRemote('reportVehicleCheat', "ANTI_COLLISION_VEHICLE", reason);
            collisionViolation = 0;
        }
    }
    function increaseCollisionViolation(increase = 1) {
        if (Date.now() - lastCollisionViolation > ANTI_COLLISION_ANTICHEAT_CONFIG.resetDetectionsAfter) {
            collisionViolation = 0;
        }
        lastCollisionViolation = Date.now();
        collisionViolation += increase;
    }
    return {
        setters: [],
        execute: function () {
            mp.setInterval(() => {
                const player = mp.players.local;
                performFlyDetection(player);
                performAntiCollisionDetection(player);
            }, 300);
            /**
             * Anti-fly Anti-Cheat System
             *
             * This system detects when players are flying in vehicles that shouldn't be able to fly.
             * It monitors:
             * - Height above ground
             * - Vertical velocity
             *
             * The system excludes aircraft (helicopters, planes, blimps) from detection.
             */
            FLY_ANTICHEAT_CONFIG = {
                heightThreshold: 10, // meters above ground
                hoveringThreshold: 2, // meters above ground to consider hovering
                violationThreshold: 10, // violations before reporting
            };
            flyViolations = 0;
            vertSpeed = 0;
            /**
             * Anti-Collision Detection
             *
             * This system detects potential collision violations in vehicles.
             * It checks if the vehicle has moved and if there are any collisions detected.
             */
            ANTI_COLLISION_ANTICHEAT_CONFIG = {
                enabled: true,
                resetDetectionsAfter: 180000, // milliseconds to reset detections
                violationThreshold: 5, // violations before reporting
            };
            prevPosition = null;
            collisionViolation = 0;
            lastCollisionViolation = 0;
            mp.rpc("vehicle_anticheat:anti_collision_enabled", (value) => {
                ANTI_COLLISION_ANTICHEAT_CONFIG.enabled = value;
            });
        }
    };
});

}
vehicle_anticheat.js
{
const IPLS = [
    "h4_islandx_terrain_01",
    "h4_islandx_terrain_01_lod",
    "h4_islandx_terrain_01_slod",
    "h4_islandx_terrain_02",
    "h4_islandx_terrain_02_lod",
    "h4_islandx_terrain_02_slod",
    "h4_islandx_terrain_03",
    "h4_islandx_terrain_03_lod",
    "h4_islandx_terrain_04",
    "h4_islandx_terrain_04_lod",
    "h4_islandx_terrain_04_slod",
    "h4_islandx_terrain_05",
    "h4_islandx_terrain_05_lod",
    "h4_islandx_terrain_05_slod",
    "h4_islandx_terrain_06",
    "h4_islandx_terrain_06_lod",
    "h4_islandx_terrain_06_slod",
    "h4_islandx_terrain_props_05_f",
    "h4_islandx_terrain_props_05_f_lod",
    "h4_islandx_terrain_props_05_f_slod",
    "h4_islandx_terrain_props_06_a",
    "h4_islandx_terrain_props_06_a_lod",
    "h4_islandx_terrain_props_06_a_slod",
    "h4_islandx_terrain_props_06_c",
    "h4_islandx_terrain_props_06_c_lod",
    "h4_islandx_terrain_props_06_c_slod",
    "h4_mph4_terrain_01",
    "h4_mph4_terrain_01_long_0",
    "h4_mph4_terrain_02",
    "h4_mph4_terrain_03",
    "h4_mph4_terrain_04",
    "h4_mph4_terrain_05",
    "h4_mph4_terrain_06",
    "h4_mph4_terrain_06_strm_0",
    "h4_mph4_terrain_lod",
    "h4_mph4_terrain_occ_01",
    "h4_mph4_terrain_occ_02",
    "h4_mph4_terrain_occ_03",
    "h4_mph4_terrain_occ_04",
    "h4_mph4_terrain_occ_05",
    "h4_mph4_terrain_occ_06",
    "h4_mph4_terrain_occ_07",
    "h4_mph4_terrain_occ_08",
    "h4_mph4_terrain_occ_09",
    "h4_islandx",
    "h4_islandx_disc_strandedshark",
    "h4_islandx_disc_strandedshark_lod",
    "h4_islandx_disc_strandedwhale",
    "h4_islandx_disc_strandedwhale_lod",
    "h4_islandx_props",
    "h4_islandx_props_lod",
    "h4_mph4_island",
    "h4_mph4_island_long_0",
    "h4_mph4_island_strm_0",
    "h4_aa_guns_lod",
    "h4_beach",
    "h4_beach_bar_props",
    "h4_beach_lod",
    "h4_beach_party",
    "h4_beach_party_lod",
    "h4_beach_props",
    "h4_beach_props_lod",
    "h4_beach_props_party",
    "h4_beach_props_slod",
    "h4_beach_slod",
    "h4_islandairstrip",
    "h4_islandairstrip_doorsclosed",
    "h4_islandairstrip_doorsclosed_lod",
    "h4_islandairstrip_doorsopen",
    "h4_islandairstrip_doorsopen_lod",
    "h4_islandairstrip_hangar_props",
    "h4_islandairstrip_hangar_props_lod",
    "h4_islandairstrip_hangar_props_slod",
    "h4_islandairstrip_lod",
    "h4_islandairstrip_props",
    "h4_islandairstrip_propsb",
    "h4_islandairstrip_propsb_lod",
    "h4_islandairstrip_propsb_slod",
    "h4_islandairstrip_props_lod",
    "h4_islandairstrip_props_slod",
    "h4_islandairstrip_slod",
    "h4_islandxcanal_props",
    "h4_islandxcanal_props_lod",
    "h4_islandxcanal_props_slod",
    "h4_islandxdock",
    "h4_islandxdock_lod",
    "h4_islandxdock_props",
    "h4_islandxdock_props_2",
    "h4_islandxdock_props_2_lod",
    "h4_islandxdock_props_2_slod",
    "h4_islandxdock_props_lod",
    "h4_islandxdock_props_slod",
    "h4_islandxdock_slod",
    "h4_islandxdock_water_hatch",
    "h4_islandxtower",
    "h4_islandxtower_lod",
    "h4_islandxtower_slod",
    "h4_islandxtower_veg",
    "h4_islandxtower_veg_lod",
    "h4_islandxtower_veg_slod",
    "h4_islandx_barrack_hatch",
    "h4_islandx_checkpoint",
    "h4_islandx_checkpoint_lod",
    "h4_islandx_maindock",
    "h4_islandx_maindock_lod",
    "h4_islandx_maindock_props",
    "h4_islandx_maindock_props_2",
    "h4_islandx_maindock_props_2_lod",
    "h4_islandx_maindock_props_2_slod",
    "h4_islandx_maindock_props_lod",
    "h4_islandx_maindock_props_slod",
    "h4_islandx_maindock_slod",
    "h4_islandx_mansion",
    "h4_islandx_mansion_b",
    "h4_islandx_mansion_b_lod",
    "h4_islandx_mansion_b_side_fence",
    "h4_islandx_mansion_b_slod",
    "h4_islandx_mansion_entrance_fence",
    "h4_islandx_mansion_guardfence",
    "h4_islandx_mansion_lights",
    "h4_islandx_mansion_lockup_01",
    "h4_islandx_mansion_lockup_01_lod",
    "h4_islandx_mansion_lockup_02",
    "h4_islandx_mansion_lockup_02_lod",
    "h4_islandx_mansion_lockup_03",
    "h4_islandx_mansion_lockup_03_lod",
    "h4_islandx_mansion_lod",
    "h4_islandx_mansion_office",
    "h4_islandx_mansion_office_lod",
    "h4_islandx_mansion_props",
    "h4_islandx_mansion_props_lod",
    "h4_islandx_mansion_props_slod",
    "h4_islandx_mansion_slod",
    "h4_islandx_mansion_vault",
    "h4_islandx_mansion_vault_lod",
    "h4_island_padlock_props",
    "h4_mansion_gate_broken",
    "h4_mansion_gate_closed",
    "h4_mansion_remains_cage",
    "h4_mph4_airstrip",
    "h4_mph4_airstrip_interior_0_airstrip_hanger",
    "h4_mph4_beach",
    "h4_mph4_dock",
    "h4_mph4_island_lod",
    "h4_mph4_mansion",
    "h4_mph4_mansion_b",
    "h4_mph4_mansion_b_strm_0",
    "h4_mph4_mansion_strm_0",
    "h4_mph4_wtowers",
    "h4_ne_ipl_00",
    "h4_ne_ipl_00_lod",
    "h4_ne_ipl_00_slod",
    "h4_ne_ipl_02",
    "h4_ne_ipl_02_lod",
    "h4_ne_ipl_02_slod",
    "h4_ne_ipl_03",
    "h4_ne_ipl_03_lod",
    "h4_ne_ipl_03_slod",
    "h4_ne_ipl_04",
    "h4_ne_ipl_04_lod",
    "h4_ne_ipl_04_slod",
    "h4_ne_ipl_05",
    "h4_ne_ipl_05_lod",
    "h4_ne_ipl_05_slod",
    "h4_ne_ipl_06",
    "h4_ne_ipl_06_lod",
    "h4_ne_ipl_06_slod",
    "h4_ne_ipl_07",
    "h4_ne_ipl_07_lod",
    "h4_ne_ipl_07_slod",
    "h4_ne_ipl_09",
    "h4_ne_ipl_09_lod",
    "h4_ne_ipl_09_slod",
    "h4_nw_ipl_00",
    "h4_nw_ipl_00_lod",
    "h4_nw_ipl_00_slod",
    "h4_nw_ipl_01",
    "h4_nw_ipl_01_lod",
    "h4_nw_ipl_01_slod",
    "h4_nw_ipl_02",
    "h4_nw_ipl_02_lod",
    "h4_nw_ipl_02_slod",
    "h4_nw_ipl_03",
    "h4_nw_ipl_03_lod",
    "h4_nw_ipl_03_slod",
    "h4_nw_ipl_04",
    "h4_nw_ipl_04_lod",
    "h4_nw_ipl_04_slod",
    "h4_nw_ipl_05",
    "h4_nw_ipl_05_lod",
    "h4_nw_ipl_05_slod",
    "h4_nw_ipl_06",
    "h4_nw_ipl_06_lod",
    "h4_nw_ipl_06_slod",
    "h4_nw_ipl_07",
    "h4_nw_ipl_07_lod",
    "h4_nw_ipl_07_slod",
    "h4_nw_ipl_08",
    "h4_nw_ipl_08_lod",
    "h4_nw_ipl_08_slod",
    "h4_nw_ipl_09",
    "h4_nw_ipl_09_lod",
    "h4_nw_ipl_09_slod",
    "h4_se_ipl_00",
    "h4_se_ipl_00_lod",
    "h4_se_ipl_00_slod",
    "h4_se_ipl_01",
    "h4_se_ipl_01_lod",
    "h4_se_ipl_01_slod",
    "h4_se_ipl_02",
    "h4_se_ipl_02_lod",
    "h4_se_ipl_02_slod",
    "h4_se_ipl_03",
    "h4_se_ipl_03_lod",
    "h4_se_ipl_03_slod",
    "h4_se_ipl_04",
    "h4_se_ipl_04_lod",
    "h4_se_ipl_04_slod",
    "h4_se_ipl_05",
    "h4_se_ipl_05_lod",
    "h4_se_ipl_05_slod",
    "h4_se_ipl_06",
    "h4_se_ipl_06_lod",
    "h4_se_ipl_06_slod",
    "h4_se_ipl_07",
    "h4_se_ipl_07_lod",
    "h4_se_ipl_07_slod",
    "h4_se_ipl_08",
    "h4_se_ipl_08_lod",
    "h4_se_ipl_08_slod",
    "h4_se_ipl_09",
    "h4_se_ipl_09_lod",
    "h4_se_ipl_09_slod",
    "h4_sw_ipl_00",
    "h4_sw_ipl_00_lod",
    "h4_sw_ipl_00_slod",
    "h4_sw_ipl_01",
    "h4_sw_ipl_01_lod",
    "h4_sw_ipl_01_slod",
    "h4_sw_ipl_02",
    "h4_sw_ipl_02_lod",
    "h4_sw_ipl_02_slod",
    "h4_sw_ipl_03",
    "h4_sw_ipl_03_lod",
    "h4_sw_ipl_03_slod",
    "h4_sw_ipl_04",
    "h4_sw_ipl_04_lod",
    "h4_sw_ipl_04_slod",
    "h4_sw_ipl_05",
    "h4_sw_ipl_05_lod",
    "h4_sw_ipl_05_slod",
    "h4_sw_ipl_06",
    "h4_sw_ipl_06_lod",
    "h4_sw_ipl_06_slod",
    "h4_sw_ipl_07",
    "h4_sw_ipl_07_lod",
    "h4_sw_ipl_07_slod",
    "h4_sw_ipl_08",
    "h4_sw_ipl_08_lod",
    "h4_sw_ipl_08_slod",
    "h4_sw_ipl_09",
    "h4_sw_ipl_09_lod",
    "h4_sw_ipl_09_slod",
    "h4_underwater_gate_closed",
];
let inCayoPerico = false;
// set island in minimap
mp.events.add("render", () => {
    mp.game.invoke("0xE81B7D2A3DAB2D81");
    mp.game.ui.setRadarAsInteriorThisFrame(3232302352, 4700.0, -5145.0, 0, 0); // interior: h4_fake_islandx
});
// enable cayo perico, welcome!
mp.setInterval(() => {
    if (!inCayoPerico) {
        let pos = mp.players.local.position;
        if (pos.x >= 1491 && pos.y <= -3300) {
            // first load all ipls
            for (let ipl of IPLS) {
                let attemp = 0;
                while (!mp.game.streaming.isIplActive(ipl)) {
                    mp.game.streaming.requestIpl(ipl);
                    attemp += 1;
                    if (attemp === 10) {
                        mp.console.logWarning("Warning: Can't load ipl: " + ipl);
                        break;
                    }
                }
            }
            // reload interior
            const interior = mp.game.interior.getInteriorAtCoords(4840.571, -5174.425, 2.0);
            mp.game.interior.refreshInterior(interior);
            // load gps routes
            mp.game.invoke("0xF74B1FFA4A15FBEA", true); // _SET_AI_GLOBAL_PATH_NODES_TYPE
            inCayoPerico = true;
        }
    }
    else if (inCayoPerico) {
        let pos = mp.players.local.position;
        if (pos.x < 1491 || pos.y > -3300) {
            if (mp.players.local.vehicle)
                return; // if change to false in vehicle, game crash
            mp.game.invoke("0xF74B1FFA4A15FBEA", false); // _SET_AI_GLOBAL_PATH_NODES_TYPE
            inCayoPerico = false;
        }
    }
}, 2000);

}
{
var InsideTrackScreen;
(function (InsideTrackScreen) {
    InsideTrackScreen[InsideTrackScreen["MAIN"] = 0] = "MAIN";
    InsideTrackScreen[InsideTrackScreen["HORSE_SELECTION"] = 1] = "HORSE_SELECTION";
    InsideTrackScreen[InsideTrackScreen["HORSE_SELECTION2"] = 2] = "HORSE_SELECTION2";
    InsideTrackScreen[InsideTrackScreen["BET_SELECTION"] = 3] = "BET_SELECTION";
    InsideTrackScreen[InsideTrackScreen["BET_SELECTION2"] = 4] = "BET_SELECTION2";
    InsideTrackScreen[InsideTrackScreen["RACE"] = 5] = "RACE";
    InsideTrackScreen[InsideTrackScreen["FINISH_PHOTO"] = 6] = "FINISH_PHOTO";
    InsideTrackScreen[InsideTrackScreen["RESULTS"] = 7] = "RESULTS";
    InsideTrackScreen[InsideTrackScreen["RESULTS2"] = 8] = "RESULTS2";
    InsideTrackScreen[InsideTrackScreen["RULES"] = 9] = "RULES";
})(InsideTrackScreen || (InsideTrackScreen = {}));
var player = mp.players.local;
let isInInsideTrack = false;
let insideTrackScaleform = -1;
let insideTrackCurrentSound = -1;
let insideTrackCurrentScreen = InsideTrackScreen.MAIN;
let insideTrackMinBet = 0;
let insideTrackSelectedHorse = -1;
let insideTrackCurrentBet = 0;
let insideTrackPlayerBalance = 0;
let insideTrackHorses = [];
let insideTrackRaceDuration = 0;
let insideTrackWinnerHorse = -1;
let isInsideTrackBigScreenLoaded = false;
let insideTrackBigScreenTarget = -1;
let insideTrackBigScreenScaleform = -1;
let insideTrackBigScreenCountdownInterval = -1;
const horseStyles = [
    [15553363, 5474797, 9858144, 4671302],
    [16724530, 3684408, 14807026, 16777215],
    [13560920, 15582764, 16770746, 7500402],
    [16558591, 5090807, 10446437, 7493977],
    [5090807, 16558591, 3815994, 9393493],
    [16269415, 16767010, 10329501, 16777215],
    [2263807, 16777215, 9086907, 3815994],
    [4879871, 16715535, 3815994, 16777215],
    [16777215, 2263807, 16769737, 15197642],
    [16338779, 16777215, 11166563, 6974058],
    [16777215, 16559849, 5716493, 3815994],
    [16760644, 3387257, 16701597, 16777215],
    [6538729, 2249420, 16777215, 3815994],
    [15913534, 15913534, 16304787, 15985375],
    [15655629, 16240452, 16760474, 13664854],
    [16320263, 16777215, 14920312, 16773316],
    [7176404, 15138618, 6308658, 13664854],
    [4879871, 8453903, 11382189, 15724527],
    [16777215, 16777215, 16754809, 16777215],
    [16732497, 16732497, 3815994, 16777215],
    [5739220, 5739220, 11382189, 15724527],
    [16712909, 6935639, 8742735, 3877137],
    [2136867, 16777215, 16761488, 3877137],
    [3118422, 10019244, 14932209, 6121086],
    [2136867, 10241979, 8081664, 3815994],
    [16769271, 13724403, 9852728, 14138263],
    [13724403, 16769271, 6444881, 14138263],
    [10017279, 4291288, 16304787, 15985375],
    [1071491, 4315247, 14935011, 6121086],
    [3861944, 16627705, 14932209, 6121086],
    [15583546, 4671303, 11836798, 3090459],
    [15567418, 4671303, 9985296, 3815994],
    [5701417, 16711680, 16771760, 6970713],
    [16760303, 5986951, 12353664, 15395562],
    [8907670, 2709022, 9475214, 4278081],
    [5429688, 6400829, 16777215, 16773316],
    [15138618, 5272210, 14920312, 16773316],
    [10241979, 12396337, 14920312, 15395562],
    [16777215, 13481261, 13667152, 3815994],
    [5077874, 16777215, 15444592, 7820105],
    [10408040, 2960685, 7424036, 10129549],
    [7754308, 16777215, 12944259, 3815994],
    [16736955, 16106560, 16771760, 6970713],
    [16106560, 16770224, 16767659, 15843765],
    [9573241, 14703194, 9789279, 3815994],
    [44799, 14703194, 10968156, 16777215],
    [7143224, 16753956, 10975076, 4210752],
    [7895160, 4013373, 5855577, 11645361],
    [16075595, 6869196, 13530742, 7105644],
    [16090955, 6272992, 16777215, 16777215],
    [13313356, 13313356, 5849409, 11623516],
    [13911070, 5583427, 14935011, 6121086],
    [8604661, 10408040, 12944259, 3815994],
    [9716612, 2960685, 16767659, 6708313],
    [7806040, 16777215, 16765601, 14144436],
    [15632075, 11221989, 16777215, 16770037],
    [1936722, 14654697, 16763851, 3815994],
    [10377543, 3815994, 14807026, 16777215],
    [16775067, 11067903, 16770746, 7500402],
    [16741712, 8669718, 16777215, 16777215],
    [16515280, 6318459, 3815994, 9393493],
    [65526, 16515280, 10329501, 16777215],
    [16711680, 4783925, 3815994, 3815994],
    [65532, 4783925, 16766671, 15197642],
    [16760303, 16760303, 3815994, 14207663],
    [16770048, 16770048, 3815994, 3815994],
    [16737792, 16737792, 11166563, 6974058],
    [12773119, 12773119, 5716493, 3815994],
    [16777215, 16763043, 16701597, 16777215],
    [6587161, 6587161, 16777215, 3815994],
    [6329328, 16749602, 3815994, 3815994],
    [15793920, 16519679, 14920312, 15395562],
    [15466636, 10724259, 16760474, 13664854],
    [11563263, 327629, 6308658, 13664854],
    [58867, 16777215, 16754809, 8082236],
    [4909311, 16777215, 5849409, 11623516],
    [3700643, 7602233, 9852728, 14138263],
    [16777215, 1017599, 8742735, 3877137],
    [16772022, 16772022, 16761488, 3877137],
    [7849983, 5067443, 8081664, 3815994],
    [15913534, 7602233, 6444881, 14138263],
    [12320733, 16775618, 11836798, 3090459],
    [15240846, 16777215, 9985296, 3815994],
    [14967137, 3702939, 3815994, 14207663],
    [6343571, 3702939, 12353664, 15395562],
    [16761374, 15018024, 9475214, 4278081],
    [16743936, 3756172, 16777215, 16773316],
    [2899345, 5393472, 16777215, 4210752],
    [11645361, 16777215, 16771542, 10123632],
    [3421236, 5958825, 16771542, 3815994],
    [15851871, 5395026, 15444592, 7820105],
    [16777215, 9463517, 7424036, 10129549],
    [16760556, 16733184, 16767659, 15843765],
    [4781311, 15771930, 16765601, 14144436],
    [16760556, 10287103, 16767659, 6708313],
    [13083490, 16777215, 9789279, 3815994],
    [13810226, 9115524, 5855577, 11645361],
    [14176336, 9115524, 13530742, 7105644],
    [16770310, 16751169, 16772294, 16777215]
];
mp.rpc("casino:inside_track:open", async (balance, horsesJson, winnerHorse, duration, minBet) => {
    insideTrackPlayerBalance = balance;
    insideTrackRaceDuration = duration;
    isInInsideTrack = true;
    insideTrackMinBet = minBet;
    insideTrackScaleform = mp.game.graphics.requestScaleformMovie("HORSE_RACING_CONSOLE");
    while (!mp.game.graphics.hasScaleformMovieLoaded(insideTrackScaleform)) {
        await mp.game.waitAsync(0);
    }
    while (!mp.game.audio.requestScriptAudioBank('DLC_VINEWOOD/CASINO_GENERAL', false, 0)) {
        await mp.game.waitAsync(0);
    }
    mp.toggleHud(false);
    updateInsideTrackHorses(horsesJson, winnerHorse);
    showInsideTrackMainScreen();
});
mp.rpc("casino:inside_track:close", () => {
    isInInsideTrack = false;
    mp.toggleHud(true);
    mp.game.graphics.setScaleformMovieAsNoLongerNeeded(insideTrackScaleform);
    insideTrackScaleform = -1;
    mp.game.audio.stopSound(insideTrackCurrentSound);
    mp.game.audio.releaseSoundId(insideTrackCurrentSound);
    mp.game.audio.releaseNamedScriptAudioBank('DLC_VINEWOOD/CASINO_GENERAL');
});
mp.rpc("casino:inside_track:update_bet", (horse, bet, balance, multiplier) => {
    updateInsideTrackHorseBet(horse, bet, balance, multiplier);
});
mp.rpc("casino:inside_track:update_horses", (horsesJson, winnerHorse) => {
    updateInsideTrackHorses(horsesJson, winnerHorse);
});
mp.events.add('render', () => {
    if (isInInsideTrack) {
        handleInsideTrackControls();
        mp.game.ui.hideHudComponentThisFrame(0);
        const xMouse = mp.game.controls.getDisabledControlNormal(2, 239);
        const yMouse = mp.game.controls.getDisabledControlNormal(2, 240);
        mp.game.graphics.beginScaleformMovieMethod(insideTrackScaleform, 'SET_MOUSE_INPUT');
        mp.game.graphics.scaleformMovieMethodAddParamFloat(xMouse);
        mp.game.graphics.scaleformMovieMethodAddParamFloat(yMouse);
        mp.game.graphics.endScaleformMovieMethod();
        mp.game.graphics.drawScaleformMovieFullscreen(insideTrackScaleform, 255, 255, 255, 255, 255);
        mp.game.controls.disableControlAction(2, 199, true);
        mp.game.controls.disableControlAction(2, 200, true);
        checkInsideTrackRaceStatus();
    }
    if (!isInInsideTrack && mp.game.streaming.isIplActive("vw_casino_main")) {
        if (!isInsideTrackBigScreenLoaded)
            loadInsideTrackBigScreen();
        if (insideTrackBigScreenTarget != -1 && insideTrackBigScreenScaleform != -1) {
            mp.game.ui.setTextRenderId(insideTrackBigScreenTarget);
            mp.game.graphics.setScriptGfxDrawOrder(4);
            mp.game.graphics.drawScaleformMovieFullscreen(insideTrackBigScreenScaleform, 255, 255, 255, 255, 255);
            mp.game.ui.setTextRenderId(mp.game.ui.getDefaultScriptRendertargetRenderId());
        }
    }
    else if (isInsideTrackBigScreenLoaded) {
        mp.game.graphics.setScaleformMovieAsNoLongerNeeded(insideTrackBigScreenScaleform);
        isInsideTrackBigScreenLoaded = false;
    }
});
function addInsideTrackHorses(scaleform) {
    const usedNameIds = new Set();
    insideTrackHorses.forEach((horse, index) => {
        const generateUniqueNameId = () => {
            let randomNameId;
            do {
                randomNameId = Math.floor(Math.random() * 99);
                if (randomNameId >= 38)
                    randomNameId += 1;
            } while (usedNameIds.has(randomNameId));
            usedNameIds.add(randomNameId);
            return randomNameId;
        };
        mp.game.graphics.beginScaleformMovieMethod(scaleform, 'SET_HORSE');
        mp.game.graphics.scaleformMovieMethodAddParamInt(index + 1);
        mp.game.graphics.beginTextCommandScaleformString(`ITH_NAME_${generateUniqueNameId().toString().padStart(3, '0')}`);
        mp.game.graphics.endTextCommandScaleformString();
        mp.game.graphics.scaleformMovieMethodAddParamPlayerNameString(horse.hint);
        const randomStyle = Math.floor(Math.random() * horseStyles.length);
        mp.game.graphics.scaleformMovieMethodAddParamInt(horseStyles[randomStyle][0]);
        mp.game.graphics.scaleformMovieMethodAddParamInt(horseStyles[randomStyle][1]);
        mp.game.graphics.scaleformMovieMethodAddParamInt(horseStyles[randomStyle][2]);
        mp.game.graphics.scaleformMovieMethodAddParamInt(horseStyles[randomStyle][3]);
        mp.game.graphics.endScaleformMovieMethod();
    });
}
function showInsideTrackScreen(screen) {
    insideTrackCurrentScreen = screen;
    mp.game.graphics.beginScaleformMovieMethod(insideTrackScaleform, 'SHOW_SCREEN');
    mp.game.graphics.scaleformMovieMethodAddParamInt(screen);
    mp.game.graphics.endScaleformMovieMethod();
}
function showInsideTrackMainScreen() {
    showInsideTrackScreen(InsideTrackScreen.MAIN);
    mp.game.graphics.beginScaleformMovieMethod(insideTrackScaleform, 'SET_MAIN_EVENT_IN_PROGRESS');
    mp.game.graphics.scaleformMovieMethodAddParamBool(true);
    mp.game.graphics.endScaleformMovieMethod();
    mp.game.graphics.beginScaleformMovieMethod(insideTrackScaleform, 'CLEAR_ALL');
    mp.game.graphics.endScaleformMovieMethod();
}
function updateInsideTrackHorseBet(horse, bet, balance, multiplier) {
    mp.game.graphics.beginScaleformMovieMethod(insideTrackScaleform, 'SET_BETTING_VALUES');
    mp.game.graphics.scaleformMovieMethodAddParamInt(horse);
    mp.game.graphics.scaleformMovieMethodAddParamInt(bet);
    mp.game.graphics.scaleformMovieMethodAddParamInt(balance);
    mp.game.graphics.scaleformMovieMethodAddParamInt(Math.trunc(bet * multiplier));
    mp.game.graphics.endScaleformMovieMethod();
    insideTrackCurrentBet = bet;
}
function updateInsideTrackHorses(horsesJson, winnerHorse) {
    insideTrackHorses = JSON.parse(horsesJson);
    insideTrackWinnerHorse = winnerHorse;
    addInsideTrackHorses(insideTrackScaleform);
}
function showInsideTrackBetScreen(horse) {
    updateInsideTrackHorseBet(horse, 0, insideTrackPlayerBalance, 0);
    mp.events.callRemote('casino:inside_track:select_horse', horse - 1);
    showInsideTrackScreen(InsideTrackScreen.BET_SELECTION);
    mp.game.graphics.beginScaleformMovieMethod(insideTrackScaleform, 'SET_BETTING_ENABLED');
    mp.game.graphics.scaleformMovieMethodAddParamBool(true);
    mp.game.graphics.endScaleformMovieMethod();
}
function startInsideTrackRace() {
    if (insideTrackCurrentBet < insideTrackMinBet)
        return;
    mp.events.callRemote("casino:inside_track:start_race", insideTrackSelectedHorse - 1);
    insideTrackCurrentSound = mp.game.audio.getSoundId();
    mp.game.audio.playSoundFrontend(insideTrackCurrentSound, 'race_loop', 'dlc_vw_casino_inside_track_betting_single_event_sounds', false);
    mp.game.graphics.beginScaleformMovieMethod(insideTrackScaleform, 'START_RACE');
    mp.game.graphics.scaleformMovieMethodAddParamFloat(insideTrackRaceDuration);
    mp.game.graphics.scaleformMovieMethodAddParamInt(4);
    const raceHorses = [insideTrackWinnerHorse, ...insideTrackHorses.map((_, index) => index).filter(index => index !== insideTrackWinnerHorse)];
    raceHorses.forEach(horse => mp.game.graphics.scaleformMovieMethodAddParamInt(horse + 1));
    mp.game.graphics.scaleformMovieMethodAddParamFloat(0.0);
    mp.game.graphics.scaleformMovieMethodAddParamBool(false);
    mp.game.graphics.endScaleformMovieMethod();
    insideTrackCurrentScreen = InsideTrackScreen.RACE;
}
async function handleInsideTrackControls() {
    if (mp.game.controls.isDisabledControlJustPressed(2, 237)) {
        const clickedButton = await getMouseClickedButton();
        if (insideTrackCurrentScreen == InsideTrackScreen.HORSE_SELECTION && clickedButton >= 2 && clickedButton != 12) {
            insideTrackSelectedHorse = clickedButton - 1;
            showInsideTrackBetScreen(insideTrackSelectedHorse);
            return;
        }
        switch (clickedButton) {
            case 1:
                showInsideTrackScreen(InsideTrackScreen.HORSE_SELECTION);
                break;
            case 12: /* Cancel buttons */
                if (insideTrackCurrentScreen === InsideTrackScreen.BET_SELECTION) {
                    showInsideTrackScreen(InsideTrackScreen.HORSE_SELECTION);
                }
                else {
                    showInsideTrackMainScreen();
                }
                break;
            case 8:
                mp.events.callRemote("casino:inside_track:rise_bet", insideTrackSelectedHorse - 1);
                break;
            case 9:
                mp.events.callRemote("casino:inside_track:lower_bet", insideTrackSelectedHorse - 1);
                break;
            case 10:
                startInsideTrackRace();
                break;
            case 13:
                showInsideTrackMainScreen();
                break;
        }
    }
}
async function getMouseClickedButton() {
    mp.game.graphics.callScaleformMovieMethodWithNumber(insideTrackScaleform, 'SET_INPUT_EVENT', 237.0, -1082130432, -1082130432, -1082130432, -1082130432);
    mp.game.graphics.beginScaleformMovieMethod(insideTrackScaleform, 'GET_CURRENT_SELECTION');
    const returnValue = mp.game.graphics.endScaleformMovieMethodReturnValue();
    while (!mp.game.graphics.isScaleformMovieMethodReturnValueReady(returnValue)) {
        await mp.game.waitAsync(0);
    }
    return mp.game.graphics.getScaleformMovieMethodReturnValueInt(returnValue);
}
async function checkInsideTrackRaceStatus() {
    if (insideTrackCurrentScreen === InsideTrackScreen.RACE) {
        const isRaceFinished = await isInsideTrackRaceFinished();
        if (isRaceFinished) {
            showInsideTrackScreen(InsideTrackScreen.RESULTS);
            mp.events.callRemote("casino:inside_track:finish_race");
            insideTrackSelectedHorse = -1;
            mp.game.audio.stopSound(insideTrackCurrentSound);
            mp.game.audio.releaseSoundId(insideTrackCurrentSound);
            insideTrackCurrentSound = -1;
        }
    }
}
async function isInsideTrackRaceFinished() {
    mp.game.graphics.beginScaleformMovieMethod(insideTrackScaleform, 'GET_RACE_IS_COMPLETE');
    const returnValue = mp.game.graphics.endScaleformMovieMethodReturnValue();
    while (!mp.game.graphics.isScaleformMovieMethodReturnValueReady(returnValue)) {
        await mp.game.waitAsync(0);
    }
    return mp.game.graphics.getScaleformMovieMethodReturnValueBool(returnValue);
}
async function loadInsideTrackBigScreen() {
    mp.game.ui.registerNamedRendertarget("casinoscreen_02", false);
    mp.game.ui.linkNamedRendertarget(mp.game.joaat("vw_vwint01_betting_screen"));
    insideTrackBigScreenTarget = mp.game.ui.getNamedRendertargetRenderId("casinoscreen_02");
    insideTrackBigScreenScaleform = mp.game.graphics.requestScaleformMovie('HORSE_RACING_WALL');
    while (!mp.game.graphics.hasScaleformMovieLoaded(insideTrackBigScreenScaleform))
        await mp.game.waitAsync(0);
    mp.game.graphics.beginScaleformMovieMethod(insideTrackBigScreenScaleform, 'SHOW_SCREEN');
    mp.game.graphics.scaleformMovieMethodAddParamInt(5);
    mp.game.graphics.endScaleformMovieMethod();
    mp.game.graphics.setScaleformFitRendertarget(insideTrackBigScreenScaleform, true);
    isInsideTrackBigScreenLoaded = true;
    insideTrackHorses = Array(6).fill({ hint: "GTAHUB", chance: 0.0 });
    setInterval(function () {
        if (!isInsideTrackBigScreenLoaded)
            return clearInterval(this);
        mp.game.graphics.beginScaleformMovieMethod(insideTrackBigScreenScaleform, 'SHOW_SCREEN');
        mp.game.graphics.scaleformMovieMethodAddParamInt(0);
        mp.game.graphics.endScaleformMovieMethod();
        clearInterval(insideTrackBigScreenCountdownInterval);
        let countdown = 60;
        insideTrackBigScreenCountdownInterval = setInterval(() => {
            mp.game.graphics.beginScaleformMovieMethod(insideTrackBigScreenScaleform, 'SET_COUNTDOWN');
            mp.game.graphics.scaleformMovieMethodAddParamInt(countdown--);
            mp.game.graphics.endScaleformMovieMethod();
        }, 1000);
        addInsideTrackHorses(insideTrackBigScreenScaleform);
        setTimeout(() => {
            mp.game.graphics.beginScaleformMovieMethod(insideTrackBigScreenScaleform, 'START_RACE');
            mp.game.graphics.scaleformMovieMethodAddParamFloat(15000);
            mp.game.graphics.scaleformMovieMethodAddParamInt(4);
            [1, 2, 3, 4, 5, 6].sort(() => 0.5 - Math.random()).forEach(num => mp.game.graphics.scaleformMovieMethodAddParamInt(num));
            mp.game.graphics.scaleformMovieMethodAddParamFloat(0.0);
            mp.game.graphics.scaleformMovieMethodAddParamBool(false);
            mp.game.graphics.endScaleformMovieMethod();
            setTimeout(() => {
                mp.game.graphics.beginScaleformMovieMethod(insideTrackBigScreenScaleform, 'SHOW_SCREEN');
                mp.game.graphics.scaleformMovieMethodAddParamInt(4);
                mp.game.graphics.endScaleformMovieMethod();
            }, 20000);
        }, 62000);
    }, 92000);
}
mp.events.add("playerQuit", (player, exitType, reason) => {
    if (player.id !== mp.players.local.id || !isInInsideTrack)
        return;
    mp.game.audio.stopSound(insideTrackCurrentSound);
    mp.game.audio.releaseSoundId(insideTrackCurrentSound);
    insideTrackCurrentSound = -1;
});

}
{
let isBettingRoulette = false;
let betObject = null;
let betModel = mp.game.joaat("vw_prop_chip_10dollar_x1");
let rouletteTable = null;
let closestChipSpot = null;
let tableMarkers = [];
const tableMarkersOffsets = {
    "0": [-0.137451171875, -0.146942138671875, 0.9449996948242188],
    "00": [-0.1387939453125, 0.10546875, 0.9449996948242188],
    "1": [-0.0560302734375, -0.1898193359375, 0.9449996948242188],
    "2": [-0.0567626953125, -0.024017333984375, 0.9449996948242188],
    "3": [-0.056884765625, 0.141632080078125, 0.9449996948242188],
    "4": [0.02392578125, -0.187347412109375, 0.9449996948242188],
    "5": [0.0240478515625, -0.02471923828125, 0.9449996948242188],
    "6": [0.02392578125, 0.1422119140625, 0.9449996948242188],
    "7": [0.1038818359375, -0.18902587890625, 0.9449996948242188],
    "8": [0.1044921875, -0.023834228515625, 0.9449996948242188],
    "9": [0.10546875, 0.1419677734375, 0.9449996948242188],
    "10": [0.18701171875, -0.188385009765625, 0.9449996948242188],
    "11": [0.18603515625, -0.0238037109375, 0.9449996948242188],
    "12": [0.1851806640625, 0.143157958984375, 0.9449996948242188],
    "13": [0.2677001953125, -0.18780517578125, 0.9449996948242188],
    "14": [0.26806640625, -0.02301025390625, 0.9449996948242188],
    "15": [0.26611328125, 0.143310546875, 0.9449996948242188],
    "16": [0.3497314453125, -0.18829345703125, 0.9449996948242188],
    "17": [0.349609375, -0.023101806640625, 0.9449996948242188],
    "18": [0.3497314453125, 0.142242431640625, 0.9449996948242188],
    "19": [0.4307861328125, -0.18829345703125, 0.9449996948242188],
    "20": [0.4312744140625, -0.02392578125, 0.9449996948242188],
    "21": [0.431884765625, 0.1416015625, 0.9449996948242188],
    "22": [0.51220703125, -0.188873291015625, 0.9449996948242188],
    "23": [0.5123291015625, -0.023773193359375, 0.9449996948242188],
    "24": [0.511962890625, 0.14215087890625, 0.9449996948242188],
    "25": [0.5931396484375, -0.18890380859375, 0.9449996948242188],
    "26": [0.59375, -0.023651123046875, 0.9449996948242188],
    "27": [0.59375, 0.14080810546875, 0.9449996948242188],
    "28": [0.67529296875, -0.189849853515625, 0.9449996948242188],
    "29": [0.6751708984375, -0.02337646484375, 0.9449996948242188],
    "30": [0.674560546875, 0.141845703125, 0.9449996948242188],
    "31": [0.756591796875, -0.18798828125, 0.9449996948242188],
    "32": [0.7547607421875, -0.0234375, 0.9449996948242188],
    "33": [0.7554931640625, 0.14263916015625, 0.9449996948242188],
    "34": [0.836669921875, -0.188323974609375, 0.9449996948242188],
    "35": [0.8365478515625, -0.0244140625, 0.9449996948242188],
    "36": [0.8359375, 0.14276123046875, 0.9449996948242188]
};
const tableChipsOffsets = [
    [-0.154541015625, -0.150604248046875, 0.9449996948242188, ["0"]],
    [-0.1561279296875, 0.11505126953125, 0.9449996948242188, ["00"]],
    [-0.059326171875, -0.18701171875, 0.9449996948242188, ["1"]],
    [-0.058349609375, -0.019378662109375, 0.9449996948242188, ["2"]],
    [-0.0587158203125, 0.142059326171875, 0.9449996948242188, ["3"]],
    [0.02294921875, -0.1920166015625, 0.9449996948242188, ["4"]],
    [0.023193359375, -0.01947021484375, 0.9449996948242188, ["5"]],
    [0.024658203125, 0.147369384765625, 0.9449996948242188, ["6"]],
    [0.105224609375, -0.1876220703125, 0.9449996948242188, ["7"]],
    [0.1055908203125, -0.028472900390625, 0.9449996948242188, ["8"]],
    [0.10400390625, 0.147430419921875, 0.9449996948242188, ["9"]],
    [0.187744140625, -0.191802978515625, 0.9449996948242188, ["10"]],
    [0.1866455078125, -0.02667236328125, 0.9449996948242188, ["11"]],
    [0.1842041015625, 0.145965576171875, 0.9449996948242188, ["12"]],
    [0.2696533203125, -0.182464599609375, 0.9449996948242188, ["13"]],
    [0.265869140625, -0.027862548828125, 0.9449996948242188, ["14"]],
    [0.2667236328125, 0.138946533203125, 0.9449996948242188, ["15"]],
    [0.35009765625, -0.186126708984375, 0.9449996948242188, ["16"]],
    [0.348876953125, -0.027740478515625, 0.9449996948242188, ["17"]],
    [0.3497314453125, 0.14715576171875, 0.9449996948242188, ["18"]],
    [0.43212890625, -0.17864990234375, 0.9449996948242188, ["19"]],
    [0.4337158203125, -0.02508544921875, 0.9449996948242188, ["20"]],
    [0.430419921875, 0.138336181640625, 0.9449996948242188, ["21"]],
    [0.51416015625, -0.18603515625, 0.9449996948242188, ["22"]],
    [0.5135498046875, -0.02301025390625, 0.9449996948242188, ["23"]],
    [0.5146484375, 0.14239501953125, 0.9449996948242188, ["24"]],
    [0.59130859375, -0.192413330078125, 0.9449996948242188, ["25"]],
    [0.596923828125, -0.022216796875, 0.9449996948242188, ["26"]],
    [0.5924072265625, 0.14385986328125, 0.9449996948242188, ["27"]],
    [0.6749267578125, -0.187286376953125, 0.9449996948242188, ["28"]],
    [0.67431640625, -0.0262451171875, 0.9449996948242188, ["29"]],
    [0.6756591796875, 0.140594482421875, 0.9449996948242188, ["30"]],
    [0.7542724609375, -0.19415283203125, 0.9449996948242188, ["31"]],
    [0.7542724609375, -0.01898193359375, 0.9449996948242188, ["32"]],
    [0.75439453125, 0.1448974609375, 0.9449996948242188, ["33"]],
    [0.8392333984375, -0.18951416015625, 0.9449996948242188, ["34"]],
    [0.837646484375, -0.023468017578125, 0.9449996948242188, ["35"]],
    [0.8380126953125, 0.14227294921875, 0.9449996948242188, ["36"]],
    [-0.1368408203125, -0.02099609375, 0.9449996948242188, ["0", "00"]],
    [-0.055419921875, -0.105804443359375, 0.9449996948242188, ["1", "2"]],
    [-0.0567626953125, 0.058624267578125, 0.9449996948242188, ["2", "3"]],
    [0.02587890625, -0.10498046875, 0.9449996948242188, ["4", "5"]],
    [0.0244140625, 0.058837890625, 0.9449996948242188, ["5", "6"]],
    [0.100341796875, -0.10382080078125, 0.9449996948242188, ["7", "8"]],
    [0.1064453125, 0.06011962890625, 0.9449996948242188, ["8", "9"]],
    [0.19189453125, -0.1060791015625, 0.9449996948242188, ["10", "11"]],
    [0.1856689453125, 0.05438232421875, 0.9449996948242188, ["11", "12"]],
    [0.27099609375, -0.10870361328125, 0.9449996948242188, ["13", "14"]],
    [0.2667236328125, 0.058502197265625, 0.9449996948242188, ["14", "15"]],
    [0.3463134765625, -0.107696533203125, 0.9449996948242188, ["16", "17"]],
    [0.34814453125, 0.0556640625, 0.9449996948242188, ["17", "18"]],
    [0.42822265625, -0.109130859375, 0.9449996948242188, ["19", "20"]],
    [0.4302978515625, 0.0550537109375, 0.9449996948242188, ["20", "21"]],
    [0.511474609375, -0.107421875, 0.9449996948242188, ["22", "23"]],
    [0.512451171875, 0.0614013671875, 0.9449996948242188, ["23", "24"]],
    [0.5980224609375, -0.107147216796875, 0.9449996948242188, ["25", "26"]],
    [0.596435546875, 0.0574951171875, 0.9449996948242188, ["26", "27"]],
    [0.673828125, -0.106903076171875, 0.9449996948242188, ["28", "29"]],
    [0.6751708984375, 0.058685302734375, 0.9449996948242188, ["29", "30"]],
    [0.7532958984375, -0.1102294921875, 0.9449996948242188, ["31", "32"]],
    [0.750244140625, 0.06103515625, 0.9449996948242188, ["32", "33"]],
    [0.834716796875, -0.108978271484375, 0.9449996948242188, ["34", "35"]],
    [0.836181640625, 0.05828857421875, 0.9449996948242188, ["35", "36"]],
    [-0.0167236328125, -0.187042236328125, 0.9449996948242188, ["1", "4"]],
    [-0.0167236328125, -0.02154541015625, 0.9449996948242188, ["2", "5"]],
    [-0.0164794921875, 0.140350341796875, 0.9449996948242188, ["3", "6"]],
    [0.064453125, -0.1865234375, 0.9449996948242188, ["4", "7"]],
    [0.06494140625, -0.01727294921875, 0.9449996948242188, ["5", "8"]],
    [0.068603515625, 0.13873291015625, 0.9449996948242188, ["6", "9"]],
    [0.144287109375, -0.184173583984375, 0.9449996948242188, ["7", "10"]],
    [0.14501953125, -0.024139404296875, 0.9449996948242188, ["8", "11"]],
    [0.14501953125, 0.136993408203125, 0.9449996948242188, ["9", "12"]],
    [0.2291259765625, -0.18670654296875, 0.9449996948242188, ["10", "13"]],
    [0.227783203125, -0.0242919921875, 0.9449996948242188, ["11", "14"]],
    [0.2286376953125, 0.14398193359375, 0.9449996948242188, ["12", "15"]],
    [0.308349609375, -0.18792724609375, 0.9449996948242188, ["13", "16"]],
    [0.308837890625, -0.02374267578125, 0.9449996948242188, ["14", "17"]],
    [0.3099365234375, 0.14410400390625, 0.9449996948242188, ["15", "18"]],
    [0.39111328125, -0.192230224609375, 0.9449996948242188, ["16", "19"]],
    [0.390869140625, -0.0189208984375, 0.9449996948242188, ["17", "20"]],
    [0.39111328125, 0.146514892578125, 0.9449996948242188, ["18", "21"]],
    [0.470947265625, -0.188690185546875, 0.9449996948242188, ["19", "22"]],
    [0.4705810546875, -0.0205078125, 0.9449996948242188, ["20", "23"]],
    [0.4725341796875, 0.140167236328125, 0.9449996948242188, ["21", "24"]],
    [0.5491943359375, -0.189666748046875, 0.9449996948242188, ["22", "25"]],
    [0.548095703125, -0.022552490234375, 0.9449996948242188, ["23", "26"]],
    [0.553955078125, 0.1446533203125, 0.9449996948242188, ["24", "27"]],
    [0.6324462890625, -0.191131591796875, 0.9449996948242188, ["25", "28"]],
    [0.635498046875, -0.0224609375, 0.9449996948242188, ["26", "29"]],
    [0.6392822265625, 0.139190673828125, 0.9449996948242188, ["27", "30"]],
    [0.71533203125, -0.187042236328125, 0.9449996948242188, ["28", "31"]],
    [0.7181396484375, -0.02447509765625, 0.9449996948242188, ["29", "32"]],
    [0.7152099609375, 0.138153076171875, 0.9449996948242188, ["30", "33"]],
    [0.7969970703125, -0.1904296875, 0.9449996948242188, ["31", "34"]],
    [0.7955322265625, -0.024871826171875, 0.9449996948242188, ["32", "35"]],
    [0.7960205078125, 0.137664794921875, 0.9449996948242188, ["33", "36"]],
    [-0.0560302734375, -0.271240234375, 0.9449996948242188, ["1", "2", "3"]],
    [0.024658203125, -0.271392822265625, 0.9449996948242188, ["4", "5", "6"]],
    [0.1051025390625, -0.272125244140625, 0.9449996948242188, ["7", "8", "9"]],
    [0.1898193359375, -0.27001953125, 0.9449996948242188, ["10", "11", "12"]],
    [0.2696533203125, -0.271697998046875, 0.9449996948242188, ["13", "14", "15"]],
    [0.351318359375, -0.268096923828125, 0.9449996948242188, ["16", "17", "18"]],
    [0.4287109375, -0.269561767578125, 0.9449996948242188, ["19", "20", "21"]],
    [0.5098876953125, -0.2716064453125, 0.9449996948242188, ["22", "23", "24"]],
    [0.5960693359375, -0.271148681640625, 0.9449996948242188, ["25", "26", "27"]],
    [0.67724609375, -0.268524169921875, 0.9449996948242188, ["28", "29", "30"]],
    [0.7523193359375, -0.27227783203125, 0.9449996948242188, ["31", "32", "33"]],
    [0.8382568359375, -0.272125244140625, 0.9449996948242188, ["34", "35", "36"]],
    [-0.017333984375, -0.106170654296875, 0.9449996948242188, ["1", "2", "4", "5"]],
    [-0.0162353515625, 0.060882568359375, 0.9449996948242188, ["2", "3", "5", "6"]],
    [0.06591796875, -0.110107421875, 0.9449996948242188, ["4", "5", "7", "8"]],
    [0.0653076171875, 0.060028076171875, 0.9449996948242188, ["5", "6", "8", "9"]],
    [0.146484375, -0.10888671875, 0.9449996948242188, ["7", "8", "10", "11"]],
    [0.1451416015625, 0.057159423828125, 0.9449996948242188, ["8", "9", "11", "12"]],
    [0.22705078125, -0.1092529296875, 0.9449996948242188, ["10", "11", "13", "14"]],
    [0.22802734375, 0.059356689453125, 0.9449996948242188, ["11", "12", "14", "15"]],
    [0.307373046875, -0.1043701171875, 0.9449996948242188, ["13", "14", "16", "17"]],
    [0.309814453125, 0.05584716796875, 0.9449996948242188, ["14", "15", "17", "18"]],
    [0.3919677734375, -0.111083984375, 0.9449996948242188, ["16", "17", "19", "20"]],
    [0.3924560546875, 0.0596923828125, 0.9449996948242188, ["17", "18", "20", "21"]],
    [0.471923828125, -0.1044921875, 0.9449996948242188, ["19", "20", "22", "23"]],
    [0.4698486328125, 0.060028076171875, 0.9449996948242188, ["20", "21", "23", "24"]],
    [0.5531005859375, -0.106170654296875, 0.9449996948242188, ["22", "23", "25", "26"]],
    [0.5546875, 0.059417724609375, 0.9449996948242188, ["23", "24", "26", "27"]],
    [0.633544921875, -0.101531982421875, 0.9449996948242188, ["25", "26", "28", "29"]],
    [0.6337890625, 0.0579833984375, 0.9449996948242188, ["26", "27", "29", "30"]],
    [0.7156982421875, -0.106292724609375, 0.9449996948242188, ["28", "29", "31", "32"]],
    [0.7158203125, 0.0604248046875, 0.9449996948242188, ["29", "30", "32", "33"]],
    [0.7947998046875, -0.108642578125, 0.9449996948242188, ["31", "32", "34", "35"]],
    [0.7952880859375, 0.059051513671875, 0.9449996948242188, ["32", "33", "35", "36"]],
    [-0.099609375, -0.2711181640625, 0.9449996948242188, ["0", "00", "1", "2", "3"]],
    [-0.0147705078125, -0.27154541015625, 0.9449996948242188, ["1", "2", "3", "4", "5", "6"]],
    [0.064697265625, -0.270263671875, 0.9449996948242188, ["4", "5", "6", "7", "8", "9"]],
    [0.144775390625, -0.271209716796875, 0.9449996948242188, ["7", "8", "9", "10", "11", "12"]],
    [0.226806640625, -0.27142333984375, 0.9449996948242188, ["10", "11", "12", "13", "14", "15"]],
    [0.306396484375, -0.27142333984375, 0.9449996948242188, ["13", "14", "15", "16", "17", "18"]],
    [0.3895263671875, -0.27099609375, 0.9449996948242188, ["16", "17", "18", "19", "20", "21"]],
    [0.468017578125, -0.275238037109375, 0.9449996948242188, ["19", "20", "21", "22", "23", "24"]],
    [0.5509033203125, -0.2738037109375, 0.9449996948242188, ["22", "23", "24", "25", "26", "27"]],
    [0.6336669921875, -0.27386474609375, 0.9449996948242188, ["25", "26", "27", "28", "29", "30"]],
    [0.7144775390625, -0.272186279296875, 0.9449996948242188, ["28", "29", "30", "31", "32", "33"]],
    [0.7935791015625, -0.272918701171875, 0.9449996948242188, ["31", "32", "33", "34", "35", "36"]],
    [0.0643310546875, -0.304718017578125, 0.9449996948242188, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]],
    [0.392822265625, -0.304779052734375, 0.9449996948242188, ["13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"]],
    [0.712158203125, -0.30303955078125, 0.9449996948242188, ["25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"]],
    [0.9222412109375, -0.185882568359375, 0.9449996948242188, ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31", "34"]],
    [0.9229736328125, -0.0181884765625, 0.9449996948242188, ["2", "5", "8", "11", "14", "17", "20", "23", "26", "29", "32", "35"]],
    [0.9248046875, 0.14849853515625, 0.9449996948242188, ["3", "6", "9", "12", "15", "18", "21", "24", "27", "30", "33", "36"]],
    [-0.011474609375, -0.378875732421875, 0.9449996948242188, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"]],
    [0.142822265625, -0.375732421875, 0.9449996948242188, ["2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30", "32", "34", "36"]],
    [0.308349609375, -0.37542724609375, 0.9449996948242188, ["1", "3", "5", "7", "9", "12", "14", "16", "18", "19", "21", "23", "25", "27", "30", "32", "34", "36"]],
    [0.4713134765625, -0.376861572265625, 0.9449996948242188, ["2", "4", "6", "8", "10", "11", "13", "15", "17", "20", "22", "24", "26", "28", "29", "31", "33", "35"]],
    [0.6341552734375, -0.376495361328125, 0.9449996948242188, ["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23", "25", "27", "29", "31", "33", "35"]],
    [0.7926025390625, -0.382232666015625, 0.9449996948242188, ["19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"]]
];
mp.rpc("casino:roulette:start_betting", (tableId) => {
    const table = mp.objects.atJoebillId(tableId);
    if (table) {
        rouletteTable = table;
        isBettingRoulette = true;
    }
});
mp.rpc("casino:roulette:set_bet", (chip) => {
    if (betObject != null) {
        betObject.model = chip;
    }
    else {
        betModel = chip;
    }
});
mp.rpc("casino:roulette:stop_betting", () => {
    rouletteTable = null;
    isBettingRoulette = false;
    closestChipSpot = null;
    clearTableMarkers();
    betObject?.destroy();
    betObject = null;
});
mp.events.add('render', () => {
    if (isBettingRoulette && !mp.gui.cursor.visible && rouletteTable != null) {
        if (betObject == null) {
            betObject = mp.objects.new(betModel, new mp.Vector3(rouletteTable.position.x, rouletteTable.position.y, rouletteTable.position.z + 0.95), { rotation: rouletteTable.rotation, dimension: mp.players.local.dimension });
            betObject.setCollision(false, false);
        }
        else {
            if (mp.game.controls.isDisabledControlJustReleased(0, 25) && closestChipSpot != null && !mp.gui.cursor.visible) {
                mp.events.callRemote("casino:roulette:remove_bet", closestChipSpot);
            }
            if (mp.game.controls.isDisabledControlJustReleased(0, 24) && closestChipSpot != null && !mp.gui.cursor.visible) {
                const betPosition = mp.game.object.getObjectOffsetFromCoords(rouletteTable.position.x, rouletteTable.position.y, rouletteTable.position.z, rouletteTable.rotation.z, tableChipsOffsets[closestChipSpot][0], tableChipsOffsets[closestChipSpot][1], tableChipsOffsets[closestChipSpot][2]);
                mp.events.callRemote("casino:roulette:make_bet", closestChipSpot, JSON.stringify(betPosition));
            }
            updateBetObject();
        }
    }
});
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function updateBetObject() {
    const mouseX = mp.game.controls.getDisabledControlNormal(0, 220);
    const mouseY = -mp.game.controls.getDisabledControlNormal(0, 221);
    const radZ = (rouletteTable.rotation.z * Math.PI) / 180;
    const forwardVector = getRouletteNormalizedVector(new mp.Vector3(-Math.sin(radZ), Math.cos(radZ), 0));
    const rightVector = getRouletteCrossProduct(forwardVector, new mp.Vector3(0, 0, 1));
    const newX = betObject.position.x + (rightVector.x * mouseX + forwardVector.x * mouseY) * 0.1;
    const newY = betObject.position.y + (rightVector.y * mouseX + forwardVector.y * mouseY) * 0.1;
    const relativeX = newX - rouletteTable.position.x;
    const relativeY = newY - rouletteTable.position.y;
    const cos = Math.cos(-radZ);
    const sin = Math.sin(-radZ);
    const localX = relativeX * cos - relativeY * sin;
    const localY = relativeX * sin + relativeY * cos;
    const clampedLocalX = clamp(localX, -.25, 1.02);
    const clampedLocalY = clamp(localY, -.52, .28);
    const cos2 = Math.cos(radZ);
    const sin2 = Math.sin(radZ);
    const worldX = clampedLocalX * cos2 - clampedLocalY * sin2;
    const worldY = clampedLocalX * sin2 + clampedLocalY * cos2;
    const newPosition = new mp.Vector3(rouletteTable.position.x + worldX, rouletteTable.position.y + worldY, rouletteTable.position.z + 0.95);
    betObject.position = newPosition;
    updateClosestChipSpot(newPosition);
}
function getRouletteNormalizedVector(vector) {
    let mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    vector.x = vector.x / mag;
    vector.y = vector.y / mag;
    vector.z = vector.z / mag;
    return vector;
}
function getRouletteCrossProduct(v1, v2) {
    let vector = new mp.Vector3(0, 0, 0);
    vector.x = v1.y * v2.z - v1.z * v2.y;
    vector.y = v1.z * v2.x - v1.x * v2.z;
    vector.z = v1.x * v2.y - v1.y * v2.x;
    return vector;
}
function clearTableMarkers() {
    for (var i = 0; i < tableMarkers.length; i++) {
        tableMarkers[i].destroy();
    }
    tableMarkers = [];
}
function updateClosestChipSpot(vector) {
    var spot = null;
    var prevDistance = 0.025;
    var dist = null;
    for (var i = 0; i < tableChipsOffsets.length; i++) {
        let newCordPos = mp.game.object.getObjectOffsetFromCoords(rouletteTable.position.x, rouletteTable.position.y, rouletteTable.position.z, rouletteTable.rotation.z, tableChipsOffsets[i][0], tableChipsOffsets[i][1], tableChipsOffsets[i][2]);
        dist = mp.game.gameplay.getDistanceBetweenCoords(vector.x, vector.y, vector.z, newCordPos.x, newCordPos.y, newCordPos.z, false);
        if (dist <= prevDistance) {
            spot = i;
            prevDistance = dist;
        }
    }
    if (spot != closestChipSpot) {
        closestChipSpot = spot;
        clearTableMarkers();
        if (spot != null) {
            var key = null;
            var obj = null;
            for (var i = 0; i < tableChipsOffsets[spot][3].length; i++) {
                key = tableChipsOffsets[spot][3][i];
                if (key == "00" || key == "0") {
                    let newCardPos = mp.game.object.getObjectOffsetFromCoords(rouletteTable.position.x, rouletteTable.position.y, rouletteTable.position.z, rouletteTable.rotation.z, tableMarkersOffsets[key][0], tableMarkersOffsets[key][1], tableMarkersOffsets[key][2]);
                    obj = mp.objects.new(269022546, new mp.Vector3(newCardPos.x, newCardPos.y, newCardPos.z), { rotation: new mp.Vector3(0, 0, rouletteTable.rotation.z), dimension: mp.players.local.dimension });
                    obj.setCollision(false, false);
                    tableMarkers.push(obj);
                }
                else {
                    let newCardPos = mp.game.object.getObjectOffsetFromCoords(rouletteTable.position.x, rouletteTable.position.y, rouletteTable.position.z, rouletteTable.rotation.z, tableMarkersOffsets[key][0], tableMarkersOffsets[key][1], tableMarkersOffsets[key][2]);
                    tableMarkers.push(mp.objects.new(3267450776, new mp.Vector3(newCardPos.x, newCardPos.y, newCardPos.z), { rotation: new mp.Vector3(0, 0, rouletteTable.rotation.z), dimension: mp.players.local.dimension }));
                }
            }
        }
    }
}

}
{
/**
 * Joebill implementation of per-player objects.
 */
System.register(["./_math_utils", "./entity_dimension"], function (exports_1, context_1) {
    "use strict";
    var _math_utils_1, entity_dimension_1, objects_translations, KeysObjects, maxPlayerObjects, playerObjects, playerMovibleObjects, editingIndex, sensitivityPos, sensitivityRot, editingRot, lastFrameMsObjects, lastSentUpdate, advancedEdit, safeEditMode, disableEditCamera, editingObjectOffset, editTextProperties, easeFunctions, fallbackModel, objectsToLoad, lastObjectLoaded, canEditRotation, snappingRayLengthMultiplier, snapping, TOWERS, lastInteriorID, wasTouchingAnything;
    var __moduleName = context_1 && context_1.id;
    // floor/wall models preloaded
    function threeDigits(num) {
        if (num <= 9)
            return "00" + num;
        if (num <= 99)
            return "0" + num;
        return "" + num;
    }
    function preloadModel(prefix, from, to) {
        for (let i = from; i <= to; i++) {
            mp.game.streaming.requestModel(mp.game.joaat(prefix + threeDigits(i)));
        }
    }
    /**
     * tryToLoadModel tries to set the given model for the object at ID,
     * or sets it to fallbackModel if fails to load.
     */
    function tryToLoadModel(objectID, model, tryNumber) {
        let obj = playerObjects[objectID];
        if (!obj || obj.realModel !== model)
            return;
        if (!mp.game.streaming.hasModelLoaded(model)) {
            if (tryNumber >= 8) {
                obj.model = fallbackModel;
                return;
            }
            mp.game.streaming.requestModel(model);
            setTimeout(() => {
                tryToLoadModel(objectID, model, tryNumber + 1);
            }, 1000);
        }
        else {
            obj.model = model;
        }
    }
    function reloadModels(list) {
        let defaultModel = mp.game.joaat("prop_paper_box_01");
        for (let o of list) {
            if (mp.objects.exists(o)) {
                let x = o.model;
                o.model = defaultModel;
                o.model = x;
            }
        }
    }
    function moveObjects() {
        let time = new Date().getTime();
        for (let _objIdx in playerMovibleObjects) {
            const objIdx = parseInt(_objIdx);
            const obj = playerMovibleObjects[objIdx];
            if (mp.objects.exists(obj) && obj.moving) {
                let lerpOffset = (time - obj.transitionBegin) / obj.transitionDuration;
                if (lerpOffset >= 1) {
                    obj.position = obj.destinationPosition;
                    obj.rotation = obj.destinationRotation;
                    obj.moving = false;
                    playerMovibleObjects.splice(objIdx, 1);
                }
                else {
                    lerpOffset = easeFunctions[obj.transitionEaseType](lerpOffset); // apply ease
                    obj.position = mp.lerpVector(obj.initialPosition, obj.destinationPosition, lerpOffset);
                    obj.rotation = mp.lerpEuler(obj.initialRotation, obj.destinationRotation, lerpOffset, obj.useLongestRotation);
                }
            }
            else {
                playerMovibleObjects.splice(objIdx, 1);
            }
        }
    }
    function isTouchingAnything(obj) {
        let result = false;
        mp.objects.forEach(obj2 => {
            if (obj2.handle && !result && obj2.id !== obj.id && obj.isTouching(obj2.handle)) {
                result = true;
            }
        });
        /*mp.players.forEachInStreamRange(p => {
            if (!result && p.handle !== 0 && obj.isTouching(p.handle)) {
                result = true;
            }
        })*/
        return result;
    }
    function objectsInInteriorHandler(playerInterior, playerRoom) {
        // hide towers in interiors
        for (let tower of TOWERS) {
            mp.game.interior.hideMapObjectThisFrame(tower);
        }
        // load interior objects
        if (Date.now() - lastObjectLoaded > 500 || objectsToLoad.length === 0) {
            lastObjectLoaded = Date.now();
            if (objectsToLoad.length === 0) {
                mp.objects.forEachInStreamRange((o) => {
                    if (o.handle && !o.isAttached() && mp.game.invoke("0x2107BA504071A6BB", o.handle) === 0) { // check if object is streamed, is not attached and interior is 0
                        objectsToLoad.push(o.handle);
                        mp.game.invoke("0x52923C4710DD9907", o.handle, playerInterior, playerRoom); // forces the same room and id on the object
                    }
                });
            }
            else {
                // try to reload objects that are in interior 0
                if (playerInterior !== 0 && playerRoom !== 0) {
                    for (let objHandle of objectsToLoad) {
                        if (mp.game.invoke("0x2107BA504071A6BB", objHandle) === 0) {
                            mp.game.invoke("0x52923C4710DD9907", objHandle, playerInterior, playerRoom);
                        }
                    }
                }
            }
        }
    }
    function rayFromPosition(pos, dir, maxDistance, ignore) {
        const rayEnd = new mp.Vector3(pos.x + maxDistance * dir.x, pos.y + maxDistance * dir.y, pos.z + maxDistance * dir.z);
        let collision = mp.raycasting.testPointToPoint(pos, rayEnd);
        if (!collision || !collision.entity)
            return null;
        const ignoreIds = ignore.map(o => o.remoteID);
        const e = collision.entity;
        if (typeof e === "number")
            return collision;
        const collObj = mp.objects.atHandle(e.handle);
        if (ignoreIds.includes(collObj.remoteID)) {
            const k = 0.001;
            const newRayStart = new mp.Vector3(collision.position.x + k * dir.x, collision.position.y + k * dir.y, collision.position.z + k * dir.z);
            collision = mp.raycasting.testPointToPoint(newRayStart, rayEnd);
            if (!collision || !collision.entity)
                return null;
        }
        return collision;
    }
    function snapObject(obj, movDirection) {
        const rayLength = 0.5 + snappingRayLengthMultiplier;
        const ed = new entity_dimension_1.default(obj);
        const center = ed.getCenterWorldOffset();
        const faceIdx = ed.getBoundingBoxFaceBasedOnDirection(movDirection);
        // Distance from the center to the face
        const offset = (faceIdx == 1 || faceIdx == 2) ? ed.getWidthX() : (faceIdx == 3 || faceIdx == 4) ? ed.getWidthY() : ed.getWidthZ();
        const rcDirection = ed.getDirection(faceIdx);
        const facePos = new mp.Vector3(offset / 2 * rcDirection.x, offset / 2 * rcDirection.y, offset / 2 * rcDirection.z);
        const rayStart = new mp.Vector3(center.x + facePos.x, center.y + facePos.y, center.z + facePos.z);
        const rayEnd = new mp.Vector3(rayStart.x + rayLength * rcDirection.x, rayStart.y + rayLength * rcDirection.y, rayStart.z + rayLength * rcDirection.z);
        let collision = rayFromPosition(center, rcDirection, rayLength + offset / 2, [obj]);
        if (!collision || !collision.entity) {
            mp.game.graphics.drawLine(rayStart.x, rayStart.y, rayStart.z, rayEnd.x, rayEnd.y, rayEnd.z, 255, 255, 255, 255);
            return null;
        }
        const sourceNormal = rcDirection.unit();
        const targetNormal = new mp.Vector3(collision.surfaceNormal.x, collision.surfaceNormal.y, collision.surfaceNormal.z).unit();
        const inverseTarget = targetNormal.negative();
        const rotMatrix = calculateRotationToSnap(sourceNormal, inverseTarget);
        let posOffset = new mp.Vector3(collision.position.x - rayStart.x, collision.position.y - rayStart.y, collision.position.z - rayStart.z);
        const rotOffset = rotMatrix.toQuaternion();
        // Calculate rotation first. If it needed, then calculate translation based on new rotation
        if (posOffset.length() > 0.1) {
            const newFacePos = rotMatrix.multiplyVector(facePos);
            const newStart = new mp.Vector3(center.x + newFacePos.x, center.y + newFacePos.y, center.z + newFacePos.z);
            const displacement = new mp.Vector3(rayStart.x - newStart.x, rayStart.y - newStart.y, rayStart.z - newStart.z);
            posOffset = new mp.Vector3(posOffset.x + displacement.x, posOffset.y + displacement.y, posOffset.z + displacement.z);
        }
        return { posOffset, rotOffset };
    }
    function calculateRotationToSnap(sourceNormal, targetNormal) {
        const src = sourceNormal.unit();
        const tgt = targetNormal.unit();
        const axis = src.cross(tgt).unit();
        const angle = Math.acos(src.dot(tgt));
        return _math_utils_1.getRotationMatrix(axis, angle);
    }
    function setObjectAlpha(obj, alpha) {
        if (obj.getAlpha() !== alpha) {
            let newObj = mp.objects.new(obj.model, obj.position, {
                alpha: alpha,
                rotation: obj.rotation,
                dimension: obj.dimension
            });
            obj.destroy();
            return newObj;
        }
        return obj;
    }
    // Util
    function groundObject(obj, changeRotX, changeRotY, changeRotZ, rx, ry, rz, range) {
        const originalPosition = obj.getCoords(true);
        // try to put in ground
        if (!obj.placeOnGroundProperly()) {
            // if fails, go down its height and try again
            let currPos = obj.position;
            obj.position = new mp.Vector3(currPos.x, currPos.y, currPos.z - obj.getHeightAboveGround());
            obj.placeOnGroundProperly();
        }
        let pos = obj.getCoords(true);
        let rot = obj.getRotation(2);
        if (!range || range && mp.game.system.vdist(originalPosition.x, originalPosition.y, originalPosition.z, pos.x, pos.y, pos.z) <= range) {
            obj.position = new mp.Vector3(pos.x, pos.y, pos.z + 0.01 /*little above ground to avoid the collision*/);
            obj.rotation = new mp.Vector3(changeRotX ? rx : rot.x, changeRotY ? ry : rot.y, changeRotZ ? rz : rot.z);
        }
        else {
            // what happened if I need a ground position but is under the map, this avoids object bug under the ground
            obj.position = originalPosition;
        }
    }
    return {
        setters: [
            function (_math_utils_1_1) {
                _math_utils_1 = _math_utils_1_1;
            },
            function (entity_dimension_1_1) {
                entity_dimension_1 = entity_dimension_1_1;
            }
        ],
        execute: function () {/**
             * Joebill implementation of per-player objects.
             */
            objects_translations = {};
            mp.rpc("player:set_server_language", (lang) => {
                objects_translations = mp.getTranslations(['move', "rotate", "changeHeight", "fixHeight", "moveFast", "save", "cancel", "editing", "editingPos", "editingRot", "delete"], lang);
            });
            preloadModel("soupfloor", 1, 37);
            preloadModel("souproof", 1, 3);
            preloadModel("soupwall", 1, 41);
            preloadModel("souplongwall", 1, 41);
            preloadModel("souphalfwall", 1, 41);
            KeysObjects = {
                Up: 0x26,
                Down: 0x28,
                Left: 0x25,
                Right: 0x27,
                Space: 0x20,
                Alt: 0x12,
                Shift: 16,
                G: 0x47, // put in ground
                F7: 0x76, // safe edit mode
                E: 0x45,
                Q: 0x51,
                X: 0x58, // switch position/rotation
                F: 0x46, // snap
                Enter: 0x0D,
                Backspace: 0x08,
                LCtrl: 17,
            };
            maxPlayerObjects = 2048;
            playerObjects = new Array(maxPlayerObjects);
            playerMovibleObjects = [];
            editingIndex = -1;
            sensitivityPos = 0.7;
            sensitivityRot = 60;
            editingRot = false;
            lastFrameMsObjects = 0;
            lastSentUpdate = 0;
            advancedEdit = false;
            safeEditMode = false; // if should check collision
            disableEditCamera = false;
            editingObjectOffset = new mp.Vector3(0, 0, 0); // object center offset, for camera
            editTextProperties = {
                font: 0,
                color: [255, 255, 255, 255],
                scale: [0.5, 0.5],
                outline: false
            };
            easeFunctions = [
                function (x) { return x; },
                function (x) { return x * x; }, // ease in (slow begin, fast end)
                function (x) { return 1 - Math.pow(1 - x, 2); }, // ease out
                function (x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }, // ease in out
            ];
            fallbackModel = mp.game.joaat("prop_laptop_01a");
            objectsToLoad = [];
            lastObjectLoaded = 0;
            canEditRotation = false;
            snappingRayLengthMultiplier = 0;
            snapping = false;
            // towers to hide in interiors
            TOWERS = [
                mp.game.joaat("ss1_10_bld"),
                mp.game.joaat("hei_dt1_20_build2"),
                mp.game.joaat("dt1_20_rl_05"),
                mp.game.joaat("dt1_20_rl_06"),
                mp.game.joaat("dt1_20_rl_07"),
                mp.game.joaat("dt1_20_rl_08"),
                mp.game.joaat("apa_ss1_11_flats"),
                mp.game.joaat("ss1_11_flats"),
            ];
            mp.objects.atJoebillId = function (id) {
                return playerObjects[id];
            };
            lastInteriorID = 0;
            mp.setInterval(() => {
                mp.events.call("objects:fix_lighting");
            }, 200);
            mp.events.add("objects:fix_lighting", () => {
                let pos = mp.players.local.position;
                let interiorID = mp.game.interior.getInteriorAtCoords(pos.x, pos.y, pos.z);
                if (interiorID !== lastInteriorID) {
                    if (interiorID === 0) {
                        lastInteriorID = 0;
                    }
                    else if (mp.game.interior.isInteriorReady(interiorID)) {
                        let list1 = [];
                        let list2 = [];
                        let list3 = [];
                        let counter = 0;
                        mp.objects.forEachInStreamRange(o => {
                            let op = o.position;
                            if (mp.game.system.vdist2(op.x, op.y, op.z, pos.x, pos.y, pos.z) < 60 * 60 && o.getAttachedTo() === 0) {
                                let reminent = counter % 3;
                                if (reminent === 0)
                                    list1.push(o);
                                else if (reminent === 1)
                                    list2.push(o);
                                else
                                    list3.push(o);
                                counter++;
                            }
                        });
                        // do in 3 chunks to reduce cpu load
                        reloadModels(list1);
                        setTimeout(() => reloadModels(list2), 200);
                        setTimeout(() => reloadModels(list3), 400);
                        lastInteriorID = interiorID;
                    }
                }
            });
            mp.rpc("po:create", (id, model, pos, rot, alpha, attachedData) => {
                if (playerObjects[id])
                    playerObjects[id].destroy();
                playerObjects[id] = mp.objects.new(model, pos, { rotation: rot, dimension: -1, alpha: alpha });
                if (!playerObjects[id]) {
                    playerObjects[id] = mp.objects.new(fallbackModel, pos, { rotation: rot, dimension: -1, alpha: alpha });
                    playerObjects[id].realModel = model;
                    tryToLoadModel(id, model, 0);
                    return;
                }
                playerObjects[id].originalPosition = pos;
                playerObjects[id].originalRotation = rot;
                playerObjects[id].remoteID = id;
                if (attachedData !== "{}") {
                    // fix 1.1 bug, wait to attach
                    setTimeout(() => {
                        let attached = JSON.parse(attachedData);
                        //mp.events.call("po:attach", id, attached.type, attached.id, attached.bone, JSON.stringify(pos), JSON.stringify(rotJson)); // @TODO: BUG!
                        mp.events.call("po:attach", id, attached.type, attached.id, attached.bone, JSON.stringify(pos), JSON.stringify({ x: rot.x, y: rot.y, z: rot.z })); // @TODO: BUG!
                    }, 30);
                }
            });
            mp.events.add("entityStreamIn", (entity) => {
                if (entity.type === 'object' && entity.isDoor) {
                    let p = entity.position;
                    mp.game.object.setStateOfClosestDoorOfType(entity.model, p.x, p.y, p.z, false, 0, false);
                }
                if (entity.type === 'object' && entity.hasCollisionDisabled === true) {
                    entity.setCollision(false, false);
                }
                if (entity.type === 'object' && entity.dynamic === true) {
                    entity.freezePosition(false);
                }
            });
            // object hit detection interval
            mp.setInterval(() => {
                if (mp.players.local.weapon !== mp.game.joaat('weapon_unarmed')) {
                    let playerHandle = mp.players.local.handle;
                    mp.objects.forEachInStreamRange(o => {
                        if (mp.objects.exists(o) && o.hasBeenDamagedBy(playerHandle, true) && o.remoteID) {
                            o.clearLastDamage();
                            mp.events.callRemote('po:on_shot', o.remoteID);
                        }
                    });
                }
            }, 50);
            /**
             * This timer re-applies to objects some properties that seems to get
             * lost when the object doesn't stream properly.
             */
            mp.setInterval(() => {
                let pos = mp.players.local.position;
                let ratio = 100 * 100; // max distance to object to re-set the properties
                for (let id = 0; id < maxPlayerObjects; id++) {
                    if (playerObjects[id]) {
                        let obj = playerObjects[id];
                        let op = obj.position;
                        if (mp.game.system.vdist2(op.x, op.y, op.z, pos.x, pos.y, pos.z) < ratio) {
                            if (obj.isDoor) {
                                mp.game.object.setStateOfClosestDoorOfType(obj.model, op.x, op.y, op.z, false, 0, false);
                            }
                            if (obj.hasCollisionDisabled) {
                                obj.setCollision(false, false);
                            }
                            if (obj.dynamic) {
                                obj.freezePosition(false);
                            }
                        }
                    }
                }
            }, 1000);
            mp.rpc("po:has_collision_disabled", (id, toggle) => {
                if (playerObjects[id]) {
                    playerObjects[id].setCollision(!toggle, false);
                    playerObjects[id].hasCollisionDisabled = toggle;
                }
            });
            mp.rpc("po:set_dynamic", (id, toggle) => {
                if (playerObjects[id]) {
                    playerObjects[id].freezePosition(!toggle);
                    playerObjects[id].dynamic = toggle;
                }
            });
            mp.rpc("po:set_alpha", (id, alpha) => {
                if (playerObjects[id]) {
                    let obj = playerObjects[id];
                    let collisionDisabled = obj.hasCollisionDisabled;
                    playerObjects[id] = mp.objects.new(obj.model, obj.position, { rotation: obj.rotation, dimension: -1, alpha: alpha });
                    if (collisionDisabled === true) {
                        mp.events.call("po:has_collision_disabled", id, true);
                    }
                    obj.destroy();
                }
            });
            mp.rpc("po:set_pos_rot", (id, pos, rot) => {
                if (playerObjects[id]) {
                    playerObjects[id].position = pos;
                    playerObjects[id].rotation = rot;
                    playerObjects[id].originalPosition = pos;
                    playerObjects[id].originalRotation = rot;
                }
            });
            /** Reports object ground position for this in po:on_ground */
            mp.rpc("po:get_ground_position", (id, range) => {
                if (playerObjects[id]) {
                    let originalModel = playerObjects[id].model;
                    // If applied just before the object is created, sometimes
                    // it doesn't report the correct position. So, delay
                    // one frame.
                    setTimeout(() => {
                        let obj = playerObjects[id];
                        if (obj && obj.model === originalModel) {
                            let obj = playerObjects[id];
                            let oldPos = obj.position;
                            let oldRot = obj.rotation;
                            groundObject(obj, false, false, false, 0.0, 0.0, 0.0, range > 0 ? range : null);
                            let pos = obj.getCoords(true);
                            let rot = obj.getRotation(2);
                            mp.events.callRemote("po:on_ground", id, JSON.stringify(pos), JSON.stringify(rot));
                            obj.position = oldPos;
                            obj.rotation = oldRot;
                        }
                    }, 100);
                }
            });
            mp.rpc("po:set_as_door", (id, toggle) => {
                if (playerObjects[id]) {
                    const obj = playerObjects[id];
                    const p = obj.position;
                    obj.isDoor = toggle;
                    mp.game.object.setStateOfClosestDoorOfType(obj.model, p.x, p.y, p.z, !toggle, 0, false);
                    setTimeout(() => {
                        if (playerObjects[id]) {
                            mp.game.object.setStateOfClosestDoorOfType(playerObjects[id].model, p.x, p.y, p.z, !toggle, 0, false);
                        }
                    }, 4000);
                }
            });
            mp.rpc("po:play_animation", (id, library, name, loop, freezeLastFrame, delta, bitset) => {
                const object = playerObjects[id];
                if (!object)
                    return;
                if (!mp.game.streaming.doesAnimDictExist(library))
                    return;
                if (!mp.game.streaming.hasAnimDictLoaded(library)) {
                    mp.game.streaming.requestAnimDict(library);
                    setTimeout(() => {
                        mp.events.call("po:play_animation", id, library, name, loop, freezeLastFrame, delta, bitset);
                    }, 200);
                    return;
                }
                object.playAnim(name, library, 1.0, loop, freezeLastFrame, false, delta, bitset);
                object.forceAiAndAnimationUpdate();
            });
            mp.rpc("po:attach", (id, entityKind, entityId, bone, offsetJson, rotationJson) => {
                if (playerObjects[id]) {
                    let otherEntity = mp.getEntityForKindAndId(entityKind, entityId);
                    if (otherEntity) {
                        let offset = JSON.parse(offsetJson);
                        let rotation = JSON.parse(rotationJson);
                        playerObjects[id].attachTo(otherEntity.handle, bone, offset.x, offset.y, offset.z, rotation.x, rotation.y, rotation.z, false, false, false, false, 2, true);
                    }
                }
            });
            mp.rpc("po:detach", (id) => {
                if (playerObjects[id]) {
                    playerObjects[id].detach(false, false);
                    // move back to its original position after detach
                    playerObjects[id].position = playerObjects[id].originalPosition;
                    playerObjects[id].rotation = playerObjects[id].originalRotation;
                }
            });
            mp.rpc("po:move", (id, destinationPos, destinationRot, alsoRotate, unitsPerSecond, easeType, useLongestRotation) => {
                if (playerObjects[id]) {
                    const obj = playerObjects[id];
                    const currentPos = obj.position;
                    const currentRot = obj.rotation;
                    // calculate timing, set ease
                    const dist = mp.game.system.vdist(currentPos.x, currentPos.y, currentPos.z, destinationPos.x, destinationPos.y, destinationPos.z);
                    let d = (dist / unitsPerSecond * 1000);
                    if (isNaN(d))
                        d = 1000;
                    obj.transitionDuration = dist === 0 && alsoRotate ? 10 / unitsPerSecond : d;
                    obj.transitionBegin = new Date().getTime();
                    obj.transitionEaseType = Math.min(easeFunctions.length, easeType);
                    // set initial/final pos
                    obj.initialPosition = obj.position;
                    obj.destinationPosition = destinationPos;
                    // set initial/final rot
                    obj.initialRotation = currentRot;
                    if (alsoRotate) {
                        obj.rotation = destinationRot;
                        obj.destinationRotation = obj.rotation; // fix in range, probably rage intenally gets it from the quaternion
                        obj.rotation = currentRot;
                        obj.useLongestRotation = useLongestRotation;
                    }
                    else {
                        obj.destinationRotation = currentRot;
                    }
                    obj.moving = true;
                    playerMovibleObjects.push(obj);
                }
            });
            mp.rpc("po:set_model", (id, model) => {
                if (playerObjects[id]) {
                    if (!mp.game.streaming.isModelValid(model))
                        model = fallbackModel;
                    playerObjects[id].model = model >>> 0;
                }
            });
            mp.rpc("po:destroy", (id) => {
                if (playerObjects[id]) {
                    playerObjects[id].destroy();
                    // TODO: if im editing this object, should probably cancel.
                    if (id === editingIndex) {
                        mp.events.callRemote("on_finish_edit_object", editingIndex, "CANCEL", JSON.stringify(new mp.Vector3(0, 0, 0)), JSON.stringify(new mp.Vector3(0, 0, 0)));
                    }
                }
                playerObjects[id] = null;
            });
            mp.rpc("po:attachTo", (id, entityType, entityId, boneId, position, rotation, collision, isPed, delayMs) => {
                mp.console.logInfo(`po:attachTo ${id} ${entityType} ${entityId} ${boneId}`);
                let obj = playerObjects[id];
                if (!obj)
                    return;
                console.log(`object: ${obj.id}`);
                const actor = mp.peds.atJoebillId(entityId);
                if (!actor)
                    return;
                console.log(`actor: ${actor.id}`);
                setTimeout(() => {
                    obj.attachTo(actor.handle, actor.getBoneIndex(boneId), position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, false, false, collision, isPed, 2, true);
                }, delayMs);
            });
            mp.rpc("po:detach", (id, applyVelocy, collision, delayMs) => {
                let obj = playerObjects[id];
                if (!obj)
                    return;
                setTimeout(() => {
                    obj.detach(applyVelocy, collision);
                }, delayMs);
            });
            // Object edition
            mp.rpc("po:edit", async (id, offset, advancedMode, bypassCollisions, disableCamera, editRotation) => {
                if (playerObjects[id]) {
                    // if already editing an object, reset its state
                    if (editingIndex !== -1 && playerObjects[editingIndex] && playerObjects[editingIndex].handle !== 0) {
                        if (!advancedMode) {
                            let obj = playerObjects[editingIndex];
                            obj.resetAlpha();
                            mp.players.local.setNoCollision(obj.handle, true);
                        }
                    }
                    editingIndex = id;
                    mp.objects.isEditingObject = true;
                    editingRot = false;
                    lastFrameMsObjects = 0;
                    lastSentUpdate = 0;
                    advancedEdit = advancedMode;
                    safeEditMode = !bypassCollisions && !advancedMode;
                    editingObjectOffset = offset;
                    wasTouchingAnything = false;
                    disableEditCamera = disableCamera;
                    canEditRotation = editRotation;
                }
            });
            mp.useInput(mp.input.EDITION_SAVE, false, function () {
                if (editingIndex === -1 || mp.gui.cursor.visible || wasTouchingAnything === true)
                    return;
                if (playerObjects[editingIndex]) {
                    let obj = playerObjects[editingIndex];
                    if (!advancedEdit) {
                        if (!disableEditCamera) {
                            mp.events.call("camera:setBehind", 500);
                        }
                        obj.resetAlpha();
                        mp.players.local.setNoCollision(obj.handle, true);
                    }
                    let editionResult = "FINAL";
                    if (obj.position.x === 0.0 && obj.position.y === 0.0 && obj.position.z === 0.0) {
                        editionResult = "CANCEL";
                    }
                    mp.events.callRemote("on_finish_edit_object", editingIndex, editionResult, JSON.stringify(obj.position), JSON.stringify(obj.rotation));
                }
                editingIndex = -1;
                mp.objects.isEditingObject = false;
            });
            mp.useInput(mp.input.EDITION_CANCEL, false, function () {
                if (editingIndex === -1 || mp.gui.cursor.visible)
                    return;
                if (playerObjects[editingIndex]) {
                    let obj = playerObjects[editingIndex];
                    if (!advancedEdit) {
                        if (!disableEditCamera) {
                            mp.events.call("camera:setBehind", 500);
                        }
                        obj.resetAlpha();
                        mp.players.local.setNoCollision(obj.handle, true);
                    }
                    mp.events.callRemote("on_finish_edit_object", editingIndex, "CANCEL", JSON.stringify(obj.position), JSON.stringify(obj.rotation));
                }
                editingIndex = -1;
                mp.objects.isEditingObject = false;
            });
            mp.useInput(mp.input.EDITION_SWITCH_POSITION_ROTATION, false, function () {
                if (editingIndex === -1 || mp.gui.cursor.visible)
                    return;
                if (canEditRotation || advancedEdit) {
                    editingRot = !editingRot;
                }
                else {
                    if (playerObjects[editingIndex]) {
                        let obj = playerObjects[editingIndex];
                        let currentRot = obj.rotation;
                        obj.rotation = new mp.Vector3(currentRot.x, currentRot.y, currentRot.z + 45.0);
                    }
                }
            });
            mp.useInput(mp.input.EDITION_GROUND, false, function () {
                if (editingIndex === -1 || mp.gui.cursor.visible)
                    return;
                if (playerObjects[editingIndex]) {
                    groundObject(playerObjects[editingIndex]);
                }
            });
            mp.useInput(mp.input.EDITION_SNAPPING_RAY_LENGTH, true, function () {
                if (editingIndex === -1 || mp.gui.cursor.visible)
                    return;
                if (snapping) {
                    snappingRayLengthMultiplier = (snappingRayLengthMultiplier + 1) % 5;
                }
            });
            wasTouchingAnything = false;
            mp.events.add("render", () => {
                moveObjects();
                let playerRoom = mp.game.invoke("0x47C2A06D4F5F424B", mp.players.local.handle); // gets the room in which the player is
                // int GET_INTERIOR_FROM_ENTITY(Entity entity); // GetInteriorFromEntity
                let playerInterior = mp.game.invoke("0x2107BA504071A6BB", mp.players.local.handle); // gets the interior in which the player is
                if (playerInterior > 0 && playerRoom > 0) {
                    if (mp.players.local.dimension > 100000) {
                        objectsInInteriorHandler(playerInterior, playerRoom);
                    }
                }
                else if (objectsToLoad.length > 0) {
                    if (mp.players.local.dimension > 100000) {
                        for (let objHandle of objectsToLoad) {
                            let obj = mp.objects.atHandle(objHandle);
                            if (mp.objects.exists(obj))
                                mp.game.invoke("0x85D5422B2039A70D", objHandle); // _CLEAR_INTERIOR_FOR_ENTITY
                        }
                    }
                    objectsToLoad = [];
                }
                if (editingIndex !== -1 && playerObjects[editingIndex] && !mp.gui.cursor.visible) {
                    // Determine Delta for frame-independent movement
                    let time = new Date().getTime();
                    if (lastFrameMsObjects === 0)
                        lastFrameMsObjects = time;
                    let delta = (time - lastFrameMsObjects) / 1000.0; // delta in seconds.
                    lastFrameMsObjects = time;
                    const cam = mp.playerCamera.getActiveCamera();
                    let front = cam.getDirection();
                    let obj = playerObjects[editingIndex];
                    let centerPos = mp.game.object.getObjectOffsetFromCoords(obj.position.x, obj.position.y, obj.position.z, obj.getHeading(), editingObjectOffset.x, editingObjectOffset.y, editingObjectOffset.z);
                    if (!advancedEdit && !disableEditCamera) {
                        const playerPos = mp.players.local.position;
                        playerPos.z += 1.3;
                        mp.events.call("camera:set", JSON.stringify(playerPos), JSON.stringify(centerPos), 0);
                    }
                    // Read keys
                    const currPos = editingRot ? obj.rotation : obj.position;
                    let up = mp.keys.isDown(KeysObjects.Up);
                    let down = mp.keys.isDown(KeysObjects.Down);
                    let left = mp.keys.isDown(KeysObjects.Left);
                    let right = mp.keys.isDown(KeysObjects.Right);
                    let alt = mp.keys.isDown(KeysObjects.Alt);
                    let shift = mp.keys.isDown(KeysObjects.Shift);
                    let space = mp.keys.isDown(KeysObjects.Space);
                    let ctrl = mp.keys.isDown(KeysObjects.LCtrl);
                    let q = mp.keys.isDown(KeysObjects.Q);
                    let e = mp.keys.isDown(KeysObjects.E);
                    let f = mp.keys.isDown(KeysObjects.F);
                    snapping = false;
                    // While holding SPACE round X,Y axes
                    if (space) {
                        front.x = Math.round(front.x);
                        front.y = Math.round(front.y);
                    }
                    // Determine sensitivity based on controls
                    let sensitivity = 0;
                    if (editingRot) {
                        front.x = 0; // invert movement for easy x,z rotation
                        front.y = 1;
                        alt = !alt; // invert alt so automatically changes z
                        // invert left/right and up/down
                        let oldLeft = left;
                        let oldRight = right;
                        left = down;
                        right = up;
                        up = oldRight;
                        down = oldLeft;
                        sensitivity = sensitivityRot * delta;
                    }
                    else {
                        sensitivity = sensitivityPos * delta;
                    }
                    if (shift)
                        sensitivity *= 3;
                    if (ctrl)
                        sensitivity /= 3;
                    if (q || e) {
                        let actualRot = obj.rotation;
                        actualRot.z = actualRot.z + (sensitivityRot * delta * (q ? -1 : 1));
                        obj.rotation = actualRot;
                    }
                    // Move the editing vector
                    let moveDirection = null;
                    if (up || down) {
                        let s = down ? -1 : 1;
                        if (!alt) {
                            currPos.x += front.x * sensitivity * s;
                            currPos.y += front.y * sensitivity * s;
                            moveDirection = new mp.Vector3(s * front.x, s * front.y, 0);
                        }
                        else {
                            currPos.z += sensitivity * s;
                            moveDirection = new mp.Vector3(0, 0, s);
                        }
                    }
                    if (left || right) {
                        let newAngle = Math.atan2(front.y, front.x) + (left ? Math.PI / 2 : -Math.PI / 2); // front vector moved 90
                        front.x = Math.cos(newAngle);
                        front.y = Math.sin(newAngle);
                        currPos.x += front.x * sensitivity;
                        currPos.y += front.y * sensitivity;
                        moveDirection = new mp.Vector3(front.x, front.y, 0);
                    }
                    if (moveDirection != null && (up || down || left || right) && f) {
                        snapping = true;
                        const result = snapObject(obj, moveDirection.unit());
                        if (result != null) {
                            const { posOffset, rotOffset } = result;
                            obj.position = new mp.Vector3(obj.position.x + posOffset.x, obj.position.y + posOffset.y, obj.position.z + posOffset.z);
                            const quaternion = _math_utils_1.multiplyQuaternions(rotOffset, mp.game.entity.getQuaternion(obj.handle));
                            obj.setQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
                            obj.rotation = obj.getRotation(2);
                            return;
                        }
                    }
                    if (editingRot) {
                        obj.rotation = currPos;
                    }
                    else {
                        obj.position = currPos;
                    }
                    // Show info about edition
                    let graphicText = "";
                    if (advancedEdit) {
                        const posCoords = `${currPos.x.toFixed(2)} ${currPos.y.toFixed(2)} ${currPos.z.toFixed(2)}`;
                        const prefix = editingRot ? "~p~" : "~y~";
                        graphicText = `${prefix}~n~${posCoords}`;
                    }
                    else {
                        if (canEditRotation) {
                            graphicText = objects_translations[editingRot ? 'editingRot' : 'editingPos'];
                        }
                        else {
                            graphicText = objects_translations["editing"];
                        }
                    }
                    let objPos = centerPos;
                    mp.game.graphics.drawText(graphicText, [objPos.x, objPos.y, objPos.z], editTextProperties);
                    // send UPDATE messages 4 times per second
                    if (time - lastSentUpdate > 250) {
                        mp.events.callRemote("on_finish_edit_object", editingIndex, "UPDATE", JSON.stringify(obj.position), JSON.stringify(obj.rotation));
                        lastSentUpdate = time;
                    }
                    // fix if isTouchingAnything
                    if (safeEditMode) {
                        // don't allow any input in this mode, as the player should be static
                        mp.game.controls.disableAllControlActions(0); // INPUTGROUP_MOVE
                        mp.game.controls.disableAllControlActions(27); // INPUTGROUP_VEH_MOVE_ALL
                        mp.game.controls.disableAllControlActions(31); // INPUTGROUP_VEH_HYDRAULICS_CONTROL
                        // keep the same position
                        let touchingAnything = isTouchingAnything(obj);
                        if (touchingAnything !== wasTouchingAnything) {
                            if (touchingAnything) {
                                obj = setObjectAlpha(obj, 51);
                                playerObjects[editingIndex] = obj;
                            }
                            else {
                                obj = setObjectAlpha(obj, 255);
                                playerObjects[editingIndex] = obj;
                            }
                        }
                        // forcefully disable collision with editing object
                        mp.players.local.setNoCollision(obj.handle, false);
                        wasTouchingAnything = isTouchingAnything(obj);
                    }
                }
            });
            mp.objects.createRenderTarget = function (name, model) {
                if (!mp.game.ui.isNamedRendertargetRegistered(name)) {
                    mp.game.ui.registerNamedRendertarget(name, false); //Register render target
                }
                if (!mp.game.ui.isNamedRendertargetLinked(model)) {
                    mp.game.ui.linkNamedRendertarget(model); //Link it to all models
                }
                if (mp.game.ui.isNamedRendertargetRegistered(name)) {
                    return mp.game.ui.getNamedRendertargetRenderId(name); //Get the handle
                }
                return -1;
            };
        }
    };
});

}
objects.js
{
System.register([], function (exports_1, context_1) {
    "use strict";
    var Matrix3x3;
    var __moduleName = context_1 && context_1.id;
    function getNormalizedDirection(from, to) {
        const direction = new mp.Vector3(to.x - from.x, to.y - from.y, to.z - from.z);
        return direction.unit();
    }
    exports_1("getNormalizedDirection", getNormalizedDirection);
    function getDistance(from, to) {
        return new mp.Vector3(to.x - from.x, to.y - from.y, to.z - from.z).length();
    }
    exports_1("getDistance", getDistance);
    function getRotationMatrix(axis, angle) {
        const { x, y, z } = axis;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const t = 1 - cos;
        return new Matrix3x3(cos + x ** 2 * t, x * y * t - z * sin, x * z * t + y * sin, y * x * t + z * sin, cos + y ** 2 * t, y * z * t - x * sin, z * x * t - y * sin, z * y * t + x * sin, cos + z ** 2 * t);
    }
    exports_1("getRotationMatrix", getRotationMatrix);
    function multiplyQuaternions(q1, q2) {
        return {
            x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
            y: q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
            z: q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w,
            w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z
        };
    }
    exports_1("multiplyQuaternions", multiplyQuaternions);
    return {
        setters: [],
        execute: function () {
            Matrix3x3 = class Matrix3x3 {
                constructor(r0c0, r0c1, r0c2, r1c0, r1c1, r1c2, r2c0, r2c1, r2c2) {
                    this.matrix = [
                        [r0c0, r0c1, r0c2],
                        [r1c0, r1c1, r1c2],
                        [r2c0, r2c1, r2c2]
                    ];
                }
                get(row, col) {
                    return this.matrix[row][col];
                }
                multiplyVector(v) {
                    return new mp.Vector3(this.matrix[0][0] * v.x + this.matrix[0][1] * v.y + this.matrix[0][2] * v.z, this.matrix[1][0] * v.x + this.matrix[1][1] * v.y + this.matrix[1][2] * v.z, this.matrix[2][0] * v.x + this.matrix[2][1] * v.y + this.matrix[2][2] * v.z);
                }
                getDeterminant() {
                    return (this.matrix[0][0] * (this.matrix[1][1] * this.matrix[2][2] - this.matrix[1][2] * this.matrix[2][1]) -
                        this.matrix[0][1] * (this.matrix[1][0] * this.matrix[2][2] - this.matrix[1][2] * this.matrix[2][0]) +
                        this.matrix[0][2] * (this.matrix[1][0] * this.matrix[2][1] - this.matrix[1][1] * this.matrix[2][0]));
                }
                getInverse() {
                    const det = this.getDeterminant();
                    // Check if matrix is invertible
                    if (Math.abs(det) < 1e-8) {
                        throw new Error("Matrix is not invertible");
                    }
                    const invDet = 1 / det;
                    return new Matrix3x3((this.matrix[1][1] * this.matrix[2][2] - this.matrix[1][2] * this.matrix[2][1]) * invDet, (this.matrix[0][2] * this.matrix[2][1] - this.matrix[0][1] * this.matrix[2][2]) * invDet, (this.matrix[0][1] * this.matrix[1][2] - this.matrix[0][2] * this.matrix[1][1]) * invDet, (this.matrix[1][2] * this.matrix[2][0] - this.matrix[1][0] * this.matrix[2][2]) * invDet, (this.matrix[0][0] * this.matrix[2][2] - this.matrix[0][2] * this.matrix[2][0]) * invDet, (this.matrix[0][2] * this.matrix[1][0] - this.matrix[0][0] * this.matrix[1][2]) * invDet, (this.matrix[1][0] * this.matrix[2][1] - this.matrix[1][1] * this.matrix[2][0]) * invDet, (this.matrix[0][1] * this.matrix[2][0] - this.matrix[0][0] * this.matrix[2][1]) * invDet, (this.matrix[0][0] * this.matrix[1][1] - this.matrix[0][1] * this.matrix[1][0]) * invDet);
                }
                toQuaternion() {
                    const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = this.matrix.flat();
                    const trace = m00 + m11 + m22;
                    let x, y, z, w;
                    if (trace > 0) {
                        const S = Math.sqrt(trace + 1.0) * 2;
                        w = 0.25 * S;
                        x = (m21 - m12) / S;
                        y = (m02 - m20) / S;
                        z = (m10 - m01) / S;
                    }
                    else {
                        if (m00 > m11 && m00 > m22) {
                            const S = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
                            w = (m21 - m12) / S;
                            x = 0.25 * S;
                            y = (m01 + m10) / S;
                            z = (m02 + m20) / S;
                        }
                        else if (m11 > m22) {
                            const S = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
                            w = (m02 - m20) / S;
                            x = (m01 + m10) / S;
                            y = 0.25 * S;
                            z = (m12 + m21) / S;
                        }
                        else {
                            const S = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
                            w = (m10 - m01) / S;
                            x = (m02 + m20) / S;
                            y = (m12 + m21) / S;
                            z = 0.25 * S;
                        }
                    }
                    return { x, y, z, w };
                }
            };
            exports_1("Matrix3x3", Matrix3x3);
        }
    };
});

}
_math_utils
{
System.register(["./_math_utils"], function (exports_1, context_1) {
    "use strict";
    var _math_utils_1, EntityDimension;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (_math_utils_1_1) {
                _math_utils_1 = _math_utils_1_1;
            }
        ],
        execute: function () {
            EntityDimension = class EntityDimension {
                constructor(entity) {
                    if (!entity || !entity.model)
                        return;
                    const { minimum, maximum } = mp.game.gameplay.getModelDimensions(entity.model);
                    this.entity = entity;
                    this.min = minimum;
                    this.max = maximum;
                    this.center = new mp.Vector3((minimum.x + maximum.x) / 2, (minimum.y + maximum.y) / 2, (minimum.z + maximum.z) / 2);
                    this.corners = this.getCorners().map(corner => entity.getOffsetFromInWorldCoords(corner.x, corner.y, corner.z));
                }
                getWidthX() {
                    return _math_utils_1.getDistance(this.corners[5], this.corners[4]);
                }
                getWidthY() {
                    return _math_utils_1.getDistance(this.corners[7], this.corners[4]);
                }
                getWidthZ() {
                    return _math_utils_1.getDistance(this.corners[4], this.corners[0]);
                }
                getDirection(face) {
                    const directionX = _math_utils_1.getNormalizedDirection(this.corners[5], this.corners[4]);
                    const directionY = _math_utils_1.getNormalizedDirection(this.corners[4], this.corners[7]);
                    const directionZ = _math_utils_1.getNormalizedDirection(this.corners[4], this.corners[0]);
                    switch (face) {
                        case 1:
                            return new mp.Vector3(directionX.x, directionX.y, directionX.z); //+X
                        case 2:
                            return new mp.Vector3(-directionX.x, -directionX.y, -directionX.z); //-X
                        case 3:
                            return new mp.Vector3(directionY.x, directionY.y, directionY.z); //+Y
                        case 4:
                            return new mp.Vector3(-directionY.x, -directionY.y, -directionY.z); //-Y
                        case 5:
                            return new mp.Vector3(directionZ.x, directionZ.y, directionZ.z); //+Z
                        case 6:
                            return new mp.Vector3(-directionZ.x, -directionZ.y, -directionZ.z); //-Z
                    }
                }
                getCorners() {
                    const corners = [];
                    corners[0] = new mp.Vector3(this.min.x, this.max.y, this.max.z);
                    corners[1] = new mp.Vector3(this.max.x, this.max.y, this.max.z);
                    corners[2] = new mp.Vector3(this.max.x, this.min.y, this.max.z);
                    corners[3] = new mp.Vector3(this.min.x, this.min.y, this.max.z);
                    corners[4] = new mp.Vector3(this.min.x, this.max.y, this.min.z);
                    corners[5] = new mp.Vector3(this.max.x, this.max.y, this.min.z);
                    corners[6] = new mp.Vector3(this.max.x, this.min.y, this.min.z);
                    corners[7] = new mp.Vector3(this.min.x, this.min.y, this.min.z);
                    return corners;
                }
                getCenterWorldOffset() {
                    return this.entity.getOffsetFromInWorldCoords(this.center.x, this.center.y, this.center.z);
                }
                getBoundingBoxFaceBasedOnDirection(direction) {
                    const localDirectionX = this.getDirection(1);
                    const localDirectionY = this.getDirection(3);
                    const localDirectionZ = this.getDirection(5);
                    const localCoordSystem = new _math_utils_1.Matrix3x3(localDirectionX.x, localDirectionY.x, localDirectionZ.x, localDirectionX.y, localDirectionY.y, localDirectionZ.y, localDirectionX.z, localDirectionY.z, localDirectionZ.z);
                    // transform vector from the canonical (world) coordinate system to a local coordinate system.
                    const invLocalCoordSystem = localCoordSystem.getInverse();
                    const localDirection = invLocalCoordSystem.multiplyVector(direction);
                    // get the face that is perpendicular to the direction
                    const coords = [localDirection.x, localDirection.y, localDirection.z];
                    const coordsAbs = coords.map(c => Math.abs(c));
                    const i = coordsAbs.indexOf(Math.max(...coordsAbs));
                    return coords[i] < 0 ? (i + 1) * 2 : (i + 1) * 2 - 1;
                }
                drawBoundingBox() {
                    const corners = this.getCorners();
                    if (this.entity) {
                        const c1 = this.entity.getOffsetFromInWorldCoords(corners[0].x, corners[0].y, corners[0].z);
                        const c2 = this.entity.getOffsetFromInWorldCoords(corners[1].x, corners[1].y, corners[1].z);
                        const c3 = this.entity.getOffsetFromInWorldCoords(corners[2].x, corners[2].y, corners[2].z);
                        const c4 = this.entity.getOffsetFromInWorldCoords(corners[3].x, corners[3].y, corners[3].z);
                        const c5 = this.entity.getOffsetFromInWorldCoords(corners[4].x, corners[4].y, corners[4].z);
                        const c6 = this.entity.getOffsetFromInWorldCoords(corners[5].x, corners[5].y, corners[5].z);
                        const c7 = this.entity.getOffsetFromInWorldCoords(corners[6].x, corners[6].y, corners[6].z);
                        const c8 = this.entity.getOffsetFromInWorldCoords(corners[7].x, corners[7].y, corners[7].z);
                        // top
                        mp.game.graphics.drawLine(c1.x, c1.y, c1.z, c2.x, c2.y, c2.z, 255, 0, 0, 255);
                        mp.game.graphics.drawLine(c2.x, c2.y, c2.z, c3.x, c3.y, c3.z, 255, 0, 0, 255);
                        mp.game.graphics.drawLine(c3.x, c3.y, c3.z, c4.x, c4.y, c4.z, 255, 0, 0, 255);
                        mp.game.graphics.drawLine(c4.x, c4.y, c4.z, c1.x, c1.y, c1.z, 255, 0, 0, 255);
                        // bottom
                        mp.game.graphics.drawLine(c5.x, c5.y, c5.z, c6.x, c6.y, c6.z, 0, 0, 255, 255);
                        mp.game.graphics.drawLine(c6.x, c6.y, c6.z, c7.x, c7.y, c7.z, 0, 0, 255, 255);
                        mp.game.graphics.drawLine(c7.x, c7.y, c7.z, c8.x, c8.y, c8.z, 0, 0, 255, 255);
                        mp.game.graphics.drawLine(c8.x, c8.y, c8.z, c5.x, c5.y, c5.z, 0, 0, 255, 255);
                        // sides
                        mp.game.graphics.drawLine(c1.x, c1.y, c1.z, c5.x, c5.y, c5.z, 0, 255, 0, 255);
                        mp.game.graphics.drawLine(c2.x, c2.y, c2.z, c6.x, c6.y, c6.z, 0, 255, 0, 255);
                        mp.game.graphics.drawLine(c3.x, c3.y, c3.z, c7.x, c7.y, c7.z, 0, 255, 0, 255);
                        mp.game.graphics.drawLine(c4.x, c4.y, c4.z, c8.x, c8.y, c8.z, 0, 255, 0, 255);
                    }
                }
                drawLocalCoordSystem() {
                    const center = this.getCenterWorldOffset();
                    const localDirectionX = this.getDirection(1);
                    const localDirectionY = this.getDirection(3);
                    const localDirectionZ = this.getDirection(5);
                    mp.game.graphics.drawLine(center.x, center.y, center.z, center.x + localDirectionX.x * 10, center.y + localDirectionX.y * 10, center.z + localDirectionX.z * 10, 255, 0, 0, 255);
                    mp.game.graphics.drawLine(center.x, center.y, center.z, center.x + localDirectionY.x * 10, center.y + localDirectionY.y * 10, center.z + localDirectionY.z * 10, 0, 255, 0, 255);
                    mp.game.graphics.drawLine(center.x, center.y, center.z, center.x + localDirectionZ.x * 10, center.y + localDirectionZ.y * 10, center.z + localDirectionZ.z * 10, 0, 0, 255, 255);
                }
            };
            exports_1("default", EntityDimension);
        }
    };
});

}
entity_dimension
{
/** Joebill implementation of per-player map icons. */
const playerBlips = {};
// TODO: This priorityList is a naive implementation
const priorityList = [];
let blipHiddenCategories = [];
let disableAllBlipCategories = false;
let maxVisibleBlips = 500;
mp.blips.atJoebillId = function (id) {
    return playerBlips[id];
};
mp.setMaxPlayerBlips = (max) => {
    maxVisibleBlips = max;
    updateVisibleBlips();
};
function createBlip(blipData) {
    const { id, sprite, pos, name, color, scale, alpha, attachedData } = blipData;
    if (sprite >= 1000) {
        createSpecialBlipHandler(id, sprite, pos, color, scale, alpha);
    }
    else {
        playerBlips[id] = mp.blips.new(sprite, pos, {
            name: name,
            scale: scale,
            color: color,
            alpha: alpha,
            shortRange: true,
            dimension: -1,
        });
        playerBlips[id].position = pos;
        if (attachedData && attachedData !== "{}") {
            let attached = JSON.parse(attachedData);
            mp.events.call("blip:attach", id, attached.type, attached.id, attached.bone, JSON.stringify(pos), JSON.stringify(new mp.Vector3(0, 0, 0)));
        }
    }
}
function createSpecialBlipHandler(id, sprite, pos, color, scale, alpha) {
    if (playerBlips[id])
        destroyBlip(id);
    let blipHandle = mp.game.ui.addBlipForRadius(pos.x, pos.y, pos.z, scale);
    playerBlips[id] = {
        model: sprite,
        id: id,
        special: true,
        handle: blipHandle,
    };
    setBlipAlpha(id, alpha);
    setBlipColor(id, color);
}
// Update attached blip positions interval
mp.setInterval(() => {
    // @TODO: This seems to be a bug, as it's iterating over an object
    //for (let id = 0; id < playerBlips.length; id++) { // Original code
    //Object.keys(playerBlips).forEach(id => { // This seems a better solution
    for (let id = 0; id < playerBlips.length; id++) { // This seems to be wrong as playerBlips is not an array, but an object with string keys interpreted as integers
        if (playerBlips[id]) {
            if (playerBlips[id].attachedTo) {
                try {
                    playerBlips[id].attachedTo.handle; // throws if attachedTo is destroyed
                    setBlipPosition(id, playerBlips[id].attachedTo.getCoords(true));
                }
                catch (e) {
                    // attached entity got destroyed, detach.
                    mp.events.call("blip:detach", id);
                }
            }
        }
    }
}, 100);
function updateVisibleBlips() {
    const currentVisible = new Set(Object.keys(playerBlips));
    const filteredBlips = priorityList
        .filter(blip => !blipHiddenCategories.includes(blip.category) && !(disableAllBlipCategories && blip.category))
        .slice(0, maxVisibleBlips)
        .map(blip => blip.id.toString());
    const shouldBeVisible = new Set(filteredBlips);
    shouldBeVisible.forEach(id => {
        if (!currentVisible.has(id)) {
            const blipData = priorityList.find(blip => blip.id == parseInt(id));
            createBlip(blipData);
        }
    });
    currentVisible.forEach(id => {
        if (!shouldBeVisible.has(id)) {
            destroyBlip(parseInt(id));
            delete playerBlips[id];
        }
    });
}
function insertSortedByPriority(blipData) {
    const { id, priority } = blipData;
    const existingIndex = priorityList.findIndex(blip => blip.id === id);
    if (existingIndex !== -1) {
        priorityList.splice(existingIndex, 1);
    }
    const insertIndex = priorityList.findIndex(item => item.priority > priority);
    if (insertIndex === -1) {
        priorityList.push(blipData);
    }
    else {
        priorityList.splice(insertIndex, 0, blipData);
    }
}
mp.rpc("blip:create", (id, sprite, pos, name, color, scale, attachedData, alpha, priority, category) => {
    insertSortedByPriority({ id, sprite, pos, name, color, scale, attachedData, alpha, priority, category });
    updateVisibleBlips();
});
mp.rpc("blip:destroy", (id) => {
    destroyBlip(id);
    delete playerBlips[id];
    const existingIndex = priorityList.findIndex(blip => blip.id === id);
    if (existingIndex !== -1) {
        priorityList.splice(existingIndex, 1);
    }
    updateVisibleBlips();
});
mp.rpc("blip:short_range", (id, shortRange) => {
    if (playerBlips[id] && !playerBlips[id].special) {
        playerBlips[id].setAsShortRange(shortRange);
    }
});
mp.rpc("blip:flashing", (id, flashing) => {
    if (playerBlips[id] && !playerBlips[id].special) {
        playerBlips[id].setFlashes(flashing);
    }
});
mp.rpc("blip:alpha", (id, alpha) => setBlipAlpha(id, alpha));
mp.rpc("blip:priority", (id, priority) => {
    const blipIndex = priorityList.findIndex(blip => blip.id === id);
    if (blipIndex !== -1 && priorityList[blipIndex].priority !== priority) {
        const blipData = priorityList.splice(blipIndex, 1)[0];
        blipData.priority = priority;
        insertSortedByPriority(blipData);
        updateVisibleBlips();
    }
});
mp.rpc("blip:name", (id, name) => {
    if (playerBlips[id] && !playerBlips[id].special) {
        mp.game.ui.beginTextCommandSetBlipName("STRING");
        mp.game.ui.addTextComponentSubstringPlayerName(name);
        playerBlips[id].endTextCommandSetName();
    }
});
mp.rpc("blip:position", (id, position) => setBlipPosition(id, position));
mp.rpc("blip:scale", (id, scale) => {
    if (playerBlips[id] && !playerBlips[id].special)
        playerBlips[id].setScale(scale);
});
mp.rpc("blip:color", (id, color) => setBlipColor(id, color));
mp.rpc("blip:route", (id, color, _customPoints = null) => {
    if (playerBlips[id] && !playerBlips[id].special) {
        playerBlips[id].setRoute(true);
        playerBlips[id].setRouteColour(color);
        const customPoints = !_customPoints ? [] : JSON.parse(_customPoints);
        if (customPoints.length > 0) {
            playerBlips[id].customRoute = true;
            mp.game.invoke("0x3D3D15AF7BCAAF83", 6, false, false); // START_GPS_MULTI_ROUTE
            for (const point of customPoints) {
                mp.game.invoke("0xA905192A6781C41B", point.x, point.y, point.z); // ADD_POINT_TO_GPS_MULTI_ROUTE
            }
            mp.game.invoke("0x3DDA37128DD1ACA8", true); // SET_GPS_MULTI_ROUTE_RENDER
        }
    }
});
mp.rpc("blip:category", (id, category) => {
    const blip = priorityList.find(blip => blip.id === id);
    if (blip) {
        blip.category = category;
        updateVisibleBlips();
    }
});
mp.rpc("blip:cancel_route", (id) => {
    if (playerBlips[id] && !playerBlips[id].special) {
        mp.game.invoke("0x3DDA37128DD1ACA8", false); // SET_GPS_MULTI_ROUTE_RENDER
        playerBlips[id].setRoute(false);
    }
});
mp.rpc("blip:attach", (id, entityKind, entityId, bone, offsetJson, rotationJson) => {
    if (playerBlips[id]) {
        let otherEntity = mp.getEntityForKindAndId(entityKind, entityId);
        if (otherEntity) {
            // offset is ignored because doesn't really change anything.
            playerBlips[id].attachedTo = otherEntity;
        }
    }
});
mp.rpc("blip:detach", (id) => {
    if (playerBlips[id]) {
        playerBlips[id].setCoords(playerBlips[id].position);
        delete playerBlips[id].attachedTo;
    }
});
mp.rpc("blip:disable_all_blip_categories", (value) => {
    disableAllBlipCategories = value;
    updateVisibleBlips();
});
mp.rpc("blip:set_categories", (stringCategories) => {
    const categories = JSON.parse(stringCategories);
    blipHiddenCategories = Object.keys(categories).filter(key => !categories[key]);
    updateVisibleBlips();
});
function setBlipAlpha(id, alpha) {
    if (!playerBlips[id])
        return;
    if (!playerBlips[id].special) {
        playerBlips[id].setAlpha(alpha);
    }
    else {
        mp.game.invoke("0x45FF974EEE1C8734", playerBlips[id].handle, alpha); // SET_BLIP_ALPHA
    }
}
function setBlipColor(id, color) {
    if (!playerBlips[id])
        return;
    if (!playerBlips[id].special) {
        playerBlips[id].setColour(color);
    }
    else {
        mp.game.invoke("0x03D7FB09E75D6B7E", playerBlips[id].handle, color); // SET_BLIP_COLOUR
    }
}
function setBlipPosition(id, position) {
    if (!playerBlips[id])
        return;
    if (!playerBlips[id].special) {
        playerBlips[id].setCoords(position);
    }
    else {
        mp.game.invoke("0xAE2AF67E9D9AF65D", playerBlips[id].handle, position); // SET_BLIP_COORDS
    }
    playerBlips[id].position = position;
}
function destroyBlip(id) {
    if (!playerBlips[id])
        return;
    if (playerBlips[id].special) {
        mp.game.ui.removeBlip(playerBlips[id].handle);
    }
    else {
        playerBlips[id].destroy();
    }
    if (playerBlips[id].customRoute)
        mp.game.invoke("0x3DDA37128DD1ACA8", false);
}

}
blips.js
{
/** Joebill adapter for actors/peds */
let playerActors = {};
let lastAimingPedId = -1;
mp.peds.atJoebillId = function (id) {
    return playerActors[id];
};
mp.rpc("pa:create", (id, model, posJson, heading) => {
    if (playerActors[id])
        playerActors[id].destroy();
    if (model === 0)
        model = mp.game.joaat('u_m_y_abner'); // fallback
    let actor = mp.peds.new(model, JSON.parse(posJson), heading, -1);
    actor.joebillId = id;
    actor.setCanBeDamaged(true);
    actor.setProofs(false, false, false, false, false, false, false, false);
    actor.setHealth(999999999); // can detect shots but can't die
    playerActors[id] = actor;
});
mp.rpc("pa:set_clothes", (id, index, drawable, texture, palette) => {
    let actor = playerActors[id];
    if (!actor)
        return;
    if (!actor.handle) {
        // deferred because is not streamed
        if (!actor._clothes)
            actor._clothes = {};
        actor._clothes[index] = {
            drawable: drawable,
            texture: texture,
            palette: palette
        };
        return;
    }
    actor.setComponentVariation(index, drawable, texture, palette);
});
mp.rpc("pa:set_props", (id, index, drawable, texture) => {
    let actor = playerActors[id];
    if (!actor)
        return;
    if (!actor.handle) {
        // deferred because is not streamed
        if (!actor._props)
            actor._props = {};
        actor._props[index] = {
            drawable: drawable,
            texture: texture
        };
        return;
    }
    actor.setPropIndex(index, drawable, texture, true);
});
mp.rpc("pa:look_at", (id, entityType, entityId, duration) => {
    let actor = playerActors[id];
    if (!actor)
        return;
    if (entityType === -1) {
        actor.taskClearLookAt();
    }
    else {
        let entity = mp.getEntityForKindAndId(entityType, entityId);
        if (entity) {
            actor.taskLookAt(entity.handle, duration, 2048, 3);
        }
        else {
            actor.taskClearLookAt();
        }
    }
});
// this timer re-runs the taskEnterVehicle for actors that got stuck.
mp.setInterval(() => {
    let now = Date.now();
    if (mp.players.local.vehicle) {
        mp.peds.forEach(p => {
            // re-run enter vehicle task, give up after 15000ms
            if (p._isInVehicleId && (now - p._isInVehicleBegin) > 15000) {
                let targetVeh = mp.vehicles.atRemoteId(p._isInVehicleId);
                if (targetVeh &&
                    targetVeh.handle &&
                    !p._isInVehicleImmediate &&
                    !p.getVehicleIsIn(false)) {
                    p._isInVehicleImmediate = true;
                    mp.putPedIntoVehicle(p);
                }
                else {
                    delete p._isInVehicleBegin;
                }
            }
        });
    }
}, 3000);
mp.rpc("pa:put_in_vehicle", (id, vehicleId, vehicleSeat, immediate) => {
    let actor = playerActors[id];
    let vehicle = mp.vehicles.atRemoteId(vehicleId);
    if (!actor || !vehicle) {
        return;
    }
    if (!vehicle.handle || !actor.handle) {
        // if actor or vehicle are not loaded yet,
        // must sync as soon as they stream.
        actor._isInVehicleId = vehicleId;
        actor._isInVehicleSeat = vehicleSeat;
        return;
    }
    actor._isInVehicleId = vehicleId;
    actor._isInVehicleSeat = vehicleSeat;
    actor._isInVehicleBegin = Date.now();
    actor._isInVehicleImmediate = immediate;
    actor.freezePosition(false); // unfreeze, as rage freezes actors.
    mp.putPedIntoVehicle(actor);
});
mp.putPedIntoVehicle = (actor) => {
    const vehicleId = actor._isInVehicleId;
    const vehicle = mp.vehicles.atRemoteId(vehicleId);
    if (!vehicle.handle || !actor.handle)
        return;
    const vehicleSeat = actor._isInVehicleSeat;
    const immediate = actor._isInVehicleImmediate;
    const mode = immediate ? 16 : 1;
    if (mp.players.local.vehicle && vehicleId == mp.players.local.vehicle.remoteId) {
        actor.taskEnterVehicle(vehicle.handle, immediate ? 1 : 8000, vehicleSeat - 1, 1, mode, 0);
        return;
    }
    mp.game.invoke("0xF75B0D629E1C063D", actor.handle, vehicle.handle, actor._isInVehicleSeat - 1); // SET_PED_INTO_VEHICLE
};
mp.rpc("pa:go_to", (id, position, angle) => {
    let actor = playerActors[id];
    if (!actor || !actor.handle)
        return;
    actor.taskGoStraightToCoord(position.x, position.y, position.z, 1.0, 15000, angle, 2.0);
});
mp.rpc("pa:remove_from_vehicle", (id, immediate) => {
    let actor = playerActors[id];
    if (!actor || !actor.handle)
        return;
    actor.taskLeaveAnyVehicle(0, 0);
    actor.shouldLeaveVehicle = true;
    delete actor._isInVehicleSeat;
    delete actor._isInVehicleId;
    delete actor._isInVehicleBegin;
    delete actor._isInVehicleImmediate;
    /*actor.taskGoStraightToCoord(
        destinationPosition.x, destinationPosition.y, destinationPosition.z,
        1.0, timeout, actor.getHeading(), 2.0);*/
});
mp.rpc("pa:destroy", (id) => {
    if (playerActors[id])
        playerActors[id].destroy();
    playerActors[id] = null;
});
mp.rpc("pa:set_pos", (id, posJson) => {
    if (playerActors[id]) {
        playerActors[id].position = JSON.parse(posJson);
    }
});
mp.rpc("pa:set_heading", (id, heading) => {
    if (playerActors[id]) {
        playerActors[id].setHeading(heading);
    }
});
mp.events.add("entityStreamIn", (_entity) => {
    if (_entity.type === 'ped') {
        const entity = _entity;
        // apply actor anim, if any
        if (entity.anim) {
            let anim = entity.anim;
            mp.events.call("pa:set_anim", entity.joebillId, anim.lib, anim.name, anim.speed, anim.flags, anim.time, anim.position, anim.angle, anim.speedMultiplier, anim.startTime);
        }
        // check if the actor is inside the vehicle.
        if (entity._isInVehicleId) {
            // disable collision to avoid crashes
            entity.setCollision(false, true);
            let v = mp.vehicles.atRemoteId(entity._isInVehicleId);
            if (v && v.handle) {
                entity._isInVehicleImmediate = true;
                mp.putPedIntoVehicle(entity);
            }
        }
        // try to set ped clothing
        if (entity._clothes) {
            const clothes = Object.entries(entity._clothes);
            if (clothes && clothes.length) {
                for (let entry of clothes) {
                    const index = parseInt(entry[0]);
                    const data = entry[1];
                    entity.setComponentVariation(index, data.drawable, data.texture, data.palette);
                }
            }
        }
        // try to set ped weapon
        if (entity._weapon) {
            mp.events.call("pa:give_weapon", entity.joebillId, entity._weapon);
        }
        if (entity._props) {
            const props = Object.entries(entity._props);
            if (props && props.length) {
                for (let entry of props) {
                    const index = parseInt(entry[0]);
                    const data = entry[1];
                    entity.setPropIndex(index, data.drawable, data.texture, true);
                }
            }
        }
    }
    else if (_entity.type === 'vehicle') {
        // check if any actor is inside this vehicle, if that's the case put into the vehicle.
        let id = _entity.remoteId;
        mp.peds.forEach(ped => {
            if (ped._isInVehicleId === id) {
                mp.putPedIntoVehicle(ped);
            }
        });
    }
});
mp.rpc("pa:set_anim", async (id, lib, name, speed, flags, time, position, angle, speedMultiplier, startTime) => {
    let actor = playerActors[id];
    if (!actor)
        return;
    let isScenario = lib.toLowerCase() === 'scenario';
    if (!isScenario && !mp.game.streaming.doesAnimDictExist(lib)) {
        return;
    }
    if (!isScenario && !mp.game.streaming.hasAnimDictLoaded(lib)) {
        mp.game.streaming.requestAnimDict(lib);
        setTimeout(() => {
            mp.events.call("pa:set_anim", id, lib, name, speed, flags, time, position, angle, speedMultiplier, startTime);
        }, 100);
        return;
    }
    // save anim to apply on entity stream
    actor.anim = { lib, name, speed, flags, time, position, angle, speedMultiplier, startTime };
    if (isScenario) {
        if (!position || !angle) {
            actor.taskStartScenarioInPlace(name, 0, false);
        }
        else {
            actor.taskStartScenarioAtPosition(name, position.x, position.y, position.z, angle, time, false, true);
        }
    }
    else {
        actor.taskPlayAnim(lib, name, speed * 2, speed * 2, -1, flags, 0.0, false, false, false);
        if (speedMultiplier != 1.0 || startTime != 0.0) {
            while (!actor.isPlayingAnim(lib, name, 3))
                await mp.game.waitAsync(0);
            actor.setAnimSpeed(lib, name, speedMultiplier);
            actor.setAnimCurrentTime(lib, name, startTime);
        }
    }
    setTimeout(() => mp.game.gameplay.clearAreaOfObjects(actor.position.x, actor.position.y, actor.position.z, 5.0, 0), 500); // clear after 500ms
    if (time !== 0) {
        actor.clearTaskTime = new Date().getTime() + time - 100;
        setTimeout(() => {
            let p2 = playerActors[id];
            if (!p2 || !p2.clearTaskTime)
                return;
            if (new Date().getTime() >= p2.clearTaskTime) {
                p2.clearTasks();
            }
        }, time);
    }
});
mp.rpc("pa:stop_animation", (id, immediate) => {
    if (playerActors[id]) {
        if (immediate) {
            playerActors[id].clearTasksImmediately();
        }
        else {
            playerActors[id].clearTasks();
        }
        delete playerActors[id].anim;
    }
});
mp.rpc("pa:set_time", (id, dict, name, time) => {
    const actor = playerActors[id];
    if (!actor)
        return;
    actor.setAnimCurrentTime(dict, name, time);
});
mp.rpc("pa:set_speed_multiplier", (id, dict, name, time) => {
    const actor = playerActors[id];
    if (!actor)
        return;
    actor.setAnimSpeed(dict, name, time);
});
mp.rpc("pa:give_weapon", (id, model) => {
    const actor = playerActors[id];
    if (!actor)
        return;
    actor._weapon = model;
    // Give weapon
    mp.game.invoke('0xBF0FD6E56C964FCB', actor.handle, actor._weapon, 0, false, false);
    // Set weapon
    mp.game.invoke('0xADF692B254977C0C', actor.handle, actor._weapon, true);
});
// block controls when actor is going into/out of the vehicle.
// aiming/shoting detection timer
mp.setInterval(() => {
    // detect aiming
    let ped = null;
    mp.peds.forEachInStreamRange(p => {
        if (mp.peds.exists(p) && p.handle && mp.game.player.isFreeAimingAtEntity(p.handle)) {
            ped = p;
        }
    });
    let pedId = -1;
    if (ped != null)
        pedId = ped.id;
    if (pedId !== lastAimingPedId) {
        lastAimingPedId = pedId;
        mp.events.callRemote("pa:on_aim", pedId);
    }
    // detect shots
    /*
    mp.peds.forEachInStreamRange(p => {
        //mp.game.invoke("0x1760FFA8AB074D66", p.handle, true)
        if (mp.peds.exists(p) && p.handle && p.hasBeenDamagedBy(mp.players.local.handle, true)) {
            let bone = p.getLastDamageBone(0);
            if (bone) {
                p.clearLastDamage();
                p.clearLastDamageBone();
                mp.events.callRemote("pa:on_shot", p.id, bone);
                mp.console.logInfo(`pa:onShot`)
            }
        }
    });*/
    // detect ped enter/exit vehicle event
    detectPedEnterExitVehicleEvent();
}, 50);
mp.setInterval(() => {
    const localPosition = mp.players.local.position;
    mp.peds.forEachInStreamRange(p => {
        const distance = mp.game.system.vdist(p.position.x, p.position.y, p.position.z, localPosition.x, localPosition.y, localPosition.z);
        // if ped is facing to player, in 0..3 meters detect, 3..8 crouch and 8..9999 walking
        if (p.isFacingPed(mp.players.local.handle, 50)) {
            if (distance < 3) {
                mp.events.callRemote("pa:on_sight", p.id);
                return;
            }
            else if (distance >= 3 && distance <= 8) {
                if (mp.players.local.getVariable("isCrouched"))
                    return; // not detect if is crouched
                mp.events.callRemote("pa:on_sight", p.id);
                return;
            }
            return;
        }
        // if ped is not facing to player, 0..4 crouch, 3..9999 walking
        if (distance < 4) {
            if (mp.players.local.getVariable("isCrouched"))
                return; // not detect if crouched
            mp.events.callRemote("pa:on_sight", p.id);
        }
    });
}, 1000);
mp.events.add('playerWeaponShot', (targetPosition, targetEntity) => {
    const ped = mp.peds.at(lastAimingPedId);
    if (ped && mp.game.player.isFreeAimingAtEntity(ped.handle)) {
        ped.clearLastDamage();
        ped.clearLastDamageBone();
        mp.events.callRemote("pa:on_shot", ped.id);
    }
});
function detectPedEnterExitVehicleEvent() {
    mp.peds.forEach(actor => {
        if (actor.handle) {
            let currentVehicleHandle = actor.getVehicleIsIn(false);
            if (!currentVehicleHandle && actor.lastVehicleHandle) {
                actor.lastVehicleHandle = null;
                if (actor.shouldLeaveVehicle) {
                    mp.events.callRemote("pa:on_exit_vehicle", actor.joebillId);
                    actor.shouldLeaveVehicle = false;
                }
            }
            else if (currentVehicleHandle && !actor.lastVehicleHandle) {
                actor.lastVehicleHandle = currentVehicleHandle;
                let v = mp.vehicles.atHandle(currentVehicleHandle);
                if (v) {
                    for (let i = -1; i < 20; i++) {
                        if (v.getPedInSeat(i) === actor.handle) {
                            mp.events.callRemote("pa:on_enter_vehicle", actor.joebillId, v.remoteId, i + 1);
                            return;
                        }
                    }
                }
            }
        }
    });
}
// Detect melee events
mp.events.add('click', (x, y, upOrDown, leftOrRight, relativeX, relativeY, worldPosition, hitEntity) => {
    if (leftOrRight === "left" && upOrDown === "down") {
        let weaponHash = mp.game.invoke(`0x0A6DB4965674D243`, mp.players.local.handle);
        let damageType = mp.game.weapon.getWeaponDamageType(weaponHash);
        let pedAiming = mp.players.local.getMeleeTargetFor(); // Returns handle of entity that player is in melee combat with
        mp.peds.forEachInStreamRange(ped => {
            // Damage type 2 is melee
            if (ped.handle === pedAiming && damageType === 2) {
                mp.events.callRemote("pa:on_melee_attack", ped.id);
            }
        });
    }
});

}
actors.js
{
let labelDefaultProps = {
    font: 0,
    color: [255, 255, 255, 223],
    scale: [0.33, 0.33],
    outline: true,
    centre: true,
};
/**
 * Implements player labels.
 */
let playerLabels = {}; // id -> { label data }
mp.labels = {
    selectedLabel: null, // if on no-clip, the selected label
    atJoebillId: function (id) {
        return playerLabels[id];
    }
};
const BASE_SCALE = 0.1;
const DISTANCE_MULTIPLIER = 0.9;
const DISTANCE_DIVISOR = 1;
const MIN_DISTANCE_SQ = 25; // 5 * 5
let maxLabels = 70;
let maxCefLabels = 5;
mp.setMaxLabels = (max) => {
    mp.console.logInfo(`Set max labels to ${max}`);
    maxLabels = max;
};
mp.setMaxCefLabels = (max) => {
    mp.console.logInfo(`Set max cef labels to ${max}`);
    maxCefLabels = max;
};
/** This event draws all the created labels */
mp.events.add("render", () => {
    mp.labels.selectedLabel = null;
    if (!mp.isHudToggled() || !mp.playerCamera.getActiveCamera()) {
        return mp.browserCall("labelsVM", "hideLabels");
    }
    const cameraPos = mp.playerCamera.getActiveCamera().getCoord();
    const now = Date.now();
    const candidates = [];
    for (const label of Object.values(playerLabels)) {
        if (label.attachedPlayer) {
            if (!mp.players.exists(label.attachedPlayer) || !label.attachedPlayer.handle || !mp.isPlayerHeadLabelsEnabled())
                continue;
            label.position = label.attachedPlayer.getBoneCoords(12844, label.attachedOffset.x, label.attachedOffset.y, label.attachedOffset.z);
        }
        if (label.attachedPed) {
            if (!mp.peds.exists(label.attachedPed) || label.attachedPed.handle === 0)
                continue;
            label.position = label.attachedPed.getBoneCoords(12844, label.attachedOffset.x, label.attachedOffset.y, label.attachedOffset.z);
        }
        const distSquared = mp.game.system.vdist2(label.position.x, label.position.y, label.position.z, cameraPos.x, cameraPos.y, cameraPos.z);
        if (distSquared > (label.drawDistance * label.drawDistance))
            continue;
        if (label.los && now - label.lastLosCheck > 100) {
            label.visible = mp.raycasting.testPointToPoint(cameraPos, label.position, null, 17) === undefined;
            label.lastLosCheck = now;
        }
        if (!label.los || label.visible) {
            candidates.push({ label, distSquared });
        }
    }
    candidates.sort((a, b) => {
        // Prioritize forced labels
        if (a.label.forceCefRendering && !b.label.forceCefRendering)
            return -1;
        if (!a.label.forceCefRendering && b.label.forceCefRendering)
            return 1;
        // Otherwise sort by distance
        return a.distSquared - b.distSquared;
    });
    const cefLabels = [];
    const showLabels = candidates.slice(0, maxLabels);
    for (let i = 0; i < showLabels.length; i++) {
        const { label, distSquared } = showLabels[i];
        const isCEF = label.forceCefRendering || i < maxCefLabels;
        const screenPos = mp.game.graphics.world3dToScreen2d(label.position.x, label.position.y, label.position.z);
        if (!screenPos)
            continue;
        let selected = false;
        if (mp.noClip.enabled && !mp.gui.cursor.visible &&
            screenPos.x >= 0.45 && screenPos.x <= 0.55 &&
            screenPos.y >= 0.45 && screenPos.y <= 0.5 &&
            !mp.labels.selectedLabel) {
            selected = true;
            mp.labels.selectedLabel = label;
        }
        const maxDistSq = label.drawDistance * label.drawDistance;
        let alpha = 1;
        if (distSquared > MIN_DISTANCE_SQ) {
            alpha = Math.max(0, 1 - (distSquared - MIN_DISTANCE_SQ) / (maxDistSq - MIN_DISTANCE_SQ));
        }
        const dist = Math.sqrt(distSquared); // Needed for scale
        const scale = BASE_SCALE + (1 / (dist * DISTANCE_MULTIPLIER));
        if (isCEF) {
            cefLabels.push({
                ...label,
                position: new mp.Vector3(screenPos.x, screenPos.y, 0),
                scale: selected ? scale * 1.3 : scale,
                alpha
            });
        }
        else {
            drawLabel(label, dist, selected);
        }
    }
    if (cefLabels.length > 0) {
        mp.browserCall("labelsVM", "showLabels", cefLabels);
    }
    else {
        mp.browserCall("labelsVM", "hideLabels");
    }
});
function drawLabel(labelData, distance, selected) {
    let scale = BASE_SCALE + (DISTANCE_DIVISOR / (distance * DISTANCE_MULTIPLIER));
    labelDefaultProps.scale[0] = scale;
    labelDefaultProps.scale[1] = scale;
    if (distance < 3) {
        labelDefaultProps.color[3] = Math.round((distance / 3.0) * 223);
    }
    else {
        labelDefaultProps.color[3] = 223;
    }
    if (selected) {
        labelDefaultProps.scale[0] *= 1.3;
        labelDefaultProps.scale[1] *= 1.3;
    }
    mp.game.graphics.drawText(labelData.text, [labelData.position.x, labelData.position.y, labelData.position.z], labelDefaultProps);
}
// RPCs
mp.rpc("pl:create", (id, text, posJson, los, drawDistance, attachedData, forceCefRendering) => {
    let position = JSON.parse(posJson);
    let label = {
        type: "label",
        joebillId: id,
        position: position,
        text: text,
        los: los,
        drawDistance: drawDistance,
        visible: false,
        lastLosCheck: 0,
        forceCefRendering: forceCefRendering,
    };
    playerLabels[id] = label;
    // set the "attached variables". Only supports attached.type 0
    if (attachedData !== "{}") {
        let attached = JSON.parse(attachedData);
        if (attached.type !== 0 && attached.type !== 4) {
            mp.console.logWarning(`Can't attach label data: ${attachedData}. Labels only supports type 0 or 4.`);
            return;
        }
        // type 0: attach to player
        if (attached.type === 0) {
            let attachedPlayer = mp.players.atRemoteId(attached.id);
            if (!attachedPlayer) {
                mp.console.logWarning(`Can't attach label ${id} to player ID ${attached.id}: player doesn't exists.`);
                // put the label at the offset coordinates with the message of why it failed.
                label.text = `(can't attach to player id ${attached.id} because doesn't exists) ${label.text}`;
                return;
            }
            label.attachedPlayer = attachedPlayer;
        }
        // type 4: attach to ped
        if (attached.type === 4) {
            let attachedPed = mp.peds.at(attached.id);
            if (!attachedPed) {
                mp.console.logWarning(`Can't attach label ${id} to ped ID ${attached.id}: ped doesn't exists.`);
                // put the label at the offset coordinates with the message of why it failed.
                label.text = `(can't attach to ped id ${attached.id} because doesn't exists) ${label.text}`;
                return;
            }
            label.attachedPed = attachedPed;
        }
        label.attachedBone = attached.bone;
        label.attachedOffset = position;
    }
});
mp.rpc("pl:destroy", (id) => {
    if (playerLabels[id]) {
        delete playerLabels[id];
    }
});
mp.rpc("pl:set_pos", (id, posJson) => {
    let position = JSON.parse(posJson);
    if (playerLabels[id]) {
        if (playerLabels[id].attachedPlayer) {
            playerLabels[id].attachedOffset = position;
        }
        else {
            playerLabels[id].position = position;
        }
    }
});
mp.rpc("pl:set_text", (id, text) => {
    if (playerLabels[id]) {
        playerLabels[id].text = text;
    }
});

}
labels.js
{
let pickups = {};
//let pickups: JsObj<PickupMp> = {}
mp.markers.atJoebillId = function (id) {
    return pickups[id];
};
let lastCP = null;
let canSeeNewPickupColor = false;
/** special alpha values to change color */
let fixedColors = [
    0xF44336FF, // red, #1
    0xE91E63FF, // pink, #2
    0x9C27B0FF, // purple, #3
    0x673AB7FF, // deepPurple, #4
    0x4361eeFF, // indigo, #5
    0x2196F3FF, // blue, #6
    0x03A9F4FF, // lightBlue, #7
    0x00BCD4FF, // cyan, #8
    0x009688FF, // teal, #9
    0x4CAF50FF, // green, #10
    0x8BC34AFF, // lightGreen, #11
    0xCDDC39FF, // lime, #12
    0xFFEB3BFF, // yellow, #13
    0xFFC107FF, // amber, #14
    0xFF9800FF, // orange, #15
    0xFF5722FF, // deepOrange, #16
    0x795548FF, // brown, #17
    0xF5F5F5FF, // lightGrey, #18
    0x9E9E9EFF // grey, #19
];
// some feedback when enters checkponts
mp.events.add("playerEnterCheckpoint", (checkpoint) => {
    if (lastCP !== checkpoint) {
        setTimeout(() => {
            mp.game.graphics.startScreenEffect('BikerFormationOut', 1000, false);
            mp.game.audio.playSoundFrontend(2, 'Click', 'DLC_HEIST_HACKING_SNAKE_SOUNDS', false);
        }, 200);
    }
});
mp.setInterval(() => {
    let myPos = mp.players.local.position;
    for (const pickupId in pickups) {
        let pickup = pickups[pickupId];
        let pos = pickup.position;
        let isIn = mp.game.system.vdist(pos.x, pos.y, pos.z, myPos.x, myPos.y, myPos.z) < (pickup.radius * 1.2);
        if (!pickup.isIn && isIn) {
            mp.events.callRemote("pickup:on_enter", parseInt(pickupId));
            pickup.isIn = true;
        }
        else if (pickup.isIn && !isIn) {
            mp.events.callRemote("pickup:on_leave", parseInt(pickupId));
            delete pickup.isIn;
        }
    }
}, 100);
mp.rpc("pickup:create", (id, model, positionJson, ratio, nextPositionJSON, alpha) => {
    if (pickups[id]) {
        pickups[id].destroy();
    }
    let pos = JSON.parse(positionJson);
    let nextPos = JSON.parse(nextPositionJSON);
    if (model === 1 || model === 100) { // special case: this marker is always on ground!
        pos.z -= 1.05;
    }
    let color = canSeeNewPickupColor ? [255, 51, 119, alpha] : [33, 150, 243, alpha];
    // special case: alpha is used to change color
    if (alpha >= 1 && alpha <= fixedColors.length) {
        let hexCode = fixedColors[alpha - 1];
        let r = (hexCode >> 24) & 0xFF;
        let g = (hexCode >> 16) & 0xFF;
        let b = (hexCode >> 8) & 0xFF;
        color = [r, g, b, 190];
    }
    if (model === 100) { // special case: model 100 uses checkpoints to create
        let type = (positionJson === nextPositionJSON) ? 4 /*finish*/ : 1;
        pickups[id] = mp.checkpoints.new(type, new mp.Vector3(pos.x, pos.y, pos.z), ratio, {
            direction: nextPos,
            color: color,
            visible: true,
            dimension: -1
        });
    }
    else {
        // invalid models crash the game
        if (model < 0 || model > 44)
            model = 0;
        pickups[id] = mp.markers.new(model, new mp.Vector3(pos.x, pos.y, pos.z), ratio, {
            color: color,
            visible: true,
            dimension: -1
        });
    }
    pickups[id].radius = ratio;
});
mp.rpc("pickup:destroy", (id) => {
    if (pickups[id]) {
        pickups[id].destroy();
        delete pickups[id];
    }
});
mp.events.add('playerReady', async () => {
    try {
        canSeeNewPickupColor = await mp.featureFlag.isEnabledGlobally('NEW_PICKUP_COLOR');
    }
    catch (e) {
        canSeeNewPickupColor = false;
        mp.console.logError("Error checking NEW_PICKUP_COLOR feature flag:", e);
    }
});

}
pickups.js
{
/// <reference path="../node_modules/@ragempcommunity/types-client/index.d.ts" />
/** Support for particles */
let existingParticles = {};
function loadParticleLibIfNecessary(lib) {
    if (!mp.game.streaming.hasNamedPtfxAssetLoaded(lib)) {
        mp.game.streaming.requestNamedPtfxAsset(lib);
        return true;
    }
    return false;
}
mp.rpc("pp:oneshot", (posJson, lib, particle, scale) => {
    if (loadParticleLibIfNecessary(lib)) {
        setTimeout(() => mp.events.call("pp:oneshot", posJson, lib, particle, scale), 250);
        return;
    }
    let pos = JSON.parse(posJson);
    mp.game.graphics.setPtfxAssetNextCall(lib);
    // use function looped because many particles not work with notLoop, will clear after one second by convention
    let pp = mp.game.graphics.startParticleFxLoopedAtCoord(particle, pos.x, pos.y, pos.z, 0.0, 0.0, 0.0, scale, false, false, false, true);
    setTimeout(() => {
        mp.game.graphics.removeParticleFx(pp, true);
    }, 1000);
});
mp.rpc("pp:create", (id, posJson, lib, particle, scale) => {
    if (existingParticles[id]) {
        mp.game.graphics.removeParticleFx(existingParticles[id], true);
    }
    if (loadParticleLibIfNecessary(lib)) {
        setTimeout(() => mp.events.call("pp:create", id, posJson, lib, particle, scale), 250);
        return;
    }
    let pos = JSON.parse(posJson);
    mp.game.graphics.setPtfxAssetNextCall(lib);
    if (mp.isFire(particle)) {
        pos = mp.getSafeZ(pos);
        mp.createFire(id, particle, pos);
    }
    existingParticles[id] = mp.game.graphics.startParticleFxLoopedAtCoord(particle, pos.x, pos.y, pos.z, 0.0, 0.0, 0.0, scale, false, false, false, true);
});
mp.rpc("pp:destroy", (id) => {
    if (existingParticles[id]) {
        let fire = mp.getFireById(id);
        if (fire)
            mp.destroyFire(fire);
        mp.game.graphics.removeParticleFx(existingParticles[id], true);
        delete existingParticles[id];
    }
});

}
particles.js
{
/** Implements sounds emitters */
require("lib/rxjs.min.js");
let playingSounds = {};
let attachedSounds = {}; // sound id -> attached entity
let anySound = false;
const pVolume = new rxjs.BehaviorSubject(0.5); //observe playerVolume changes, 0.50 default for startup when player volume is not set yet
let data = {};
function playMp3(id, sound, volume, loop, use3d, pos, ratio, secondsPassed = 0) {
    mp.browserExecute("playSound(" + id + "," + JSON.stringify(sound) + "," + volume + ", " + loop + "," + use3d + "," + pos + "," + ratio + ", " + secondsPassed + ")");
}
function stopMp3(id) {
    mp.browserExecute("stopSound(" + id + ")");
}
mp.players.local.volume = () => pVolume.getValue();
// warm up browser
playMp3(-1, "weapon_drop_1", 0.001, false, false, JSON.stringify(new mp.Vector3(0, 0, 0)), 1);
//    call("sound:play", "issfbffos", id, name, set, volume, loop && id != -1, ratio, secondsPassed, position, "{}")
mp.rpc("sound:play", (id, sound, set, volume, loop, ratio, secondsPassed, coordsJson, attachedData) => {
    let finalVolume = pVolume.getValue();
    //save all data received
    if (!data[id]) {
        data[id] = {};
    }
    data[id] = {
        sound: sound,
        set: set,
        volume: volume,
        loop: loop,
        ratio: ratio,
        secondsPassed: secondsPassed,
        coordsJson: coordsJson,
        attachedData: attachedData,
        lastUpdate: Date.now()
    };
    let pos = JSON.parse(coordsJson);
    if (set === "mp3") {
        let use3d = pos.x !== 0 || pos.y !== 0 || pos.z !== 0;
        playMp3(id, sound, (volume * finalVolume), loop, use3d, coordsJson, ratio, secondsPassed);
    }
    else {
        if (playingSounds[id] === "mp3") {
            stopMp3(id);
        }
        mp.game.audio.playSoundFromCoord(id, sound, pos.x, pos.y, pos.z, set, false, 0, false);
    }
    if (id !== -1) {
        playingSounds[id] = set;
        delete attachedSounds[id];
        if (attachedData !== "{}") {
            let attached = JSON.parse(attachedData);
            mp.events.call("sound:attach", id, attached.type, attached.id, attached.bone, pos, JSON.stringify(new mp.Vector3(0, 0, 0)));
        }
    }
    anySound = true;
});
mp.rpc("sound:stop", (id) => {
    if (playingSounds[id]) {
        if (playingSounds[id] === "mp3") {
            stopMp3(id);
        }
        else {
            mp.game.audio.stopSound(id);
            mp.game.audio.releaseSoundId(id);
        }
        delete playingSounds[id];
        delete attachedSounds[id];
        delete data[id];
        anySound = Object.entries(playingSounds).length !== 0;
    }
});
mp.rpc("sound:attach", (id, entityKind, entityId, bone, offsetJson, rotationJson) => {
    if (playingSounds[id] === "mp3") {
        let otherEntity = mp.getEntityForKindAndId(entityKind, entityId);
        if (otherEntity) {
            attachedSounds[id] = otherEntity;
        }
    }
});
mp.rpc("sound:detach", (id) => {
    if (playingSounds[id] && attachedSounds[id]) {
        delete attachedSounds[id];
        delete data[id];
    }
});
mp.rpc("sound:setVolume", (volume) => {
    pVolume.next(volume);
});
pVolume.subscribe((volume) => {
    let currentTime = Date.now();
    for (let id in playingSounds) {
        if (playingSounds.hasOwnProperty(id) && data[id]) {
            let soundData = data[id];
            if (soundData.lastUpdate) {
                let timeElapsed = (currentTime - soundData.lastUpdate) / 1000;
                soundData.secondsPassed += timeElapsed;
            }
            if (playingSounds[id] === "mp3") {
                mp.events.call("sound:play", id, soundData.sound, soundData.set, soundData.volume, soundData.loop, soundData.ratio, soundData.secondsPassed, soundData.coordsJson, soundData.attachedData);
            }
        }
    }
});
let oldFocused = true;
mp.setInterval(() => {
    // sound seems to be a little slower to process
    // by the brain, so changes in position every 50ms
    // won't feel laggy.
    if (!anySound)
        return;
    let focused = (mp.system || { isFocused: true }).isFocused;
    if (focused !== oldFocused) {
        mp.browserExecute("mute(!" + focused + ")");
        oldFocused = focused;
    }
    // move the camera slightly on every tick, sounds gets glitchy while camera rot is stationary for a sec or so
    const camera = mp.playerCamera.getActiveCamera();
    const coords = camera.getCoord();
    const front = camera.getDirection();
    front.x += 0.01 * Math.random();
    front.y += 0.01 * Math.random();
    front.z += 0.01 * Math.random();
    mp.browserExecute("updateListener(" + JSON.stringify(coords) + "," + JSON.stringify(front) + ")");
    const playerPos = mp.players.local.position;
    mp.browserExecute("updateStreamingListener(" + JSON.stringify(playerPos) + ")");
    for (const soundId in attachedSounds) {
        let entity = attachedSounds[soundId];
        try {
            mp.browserExecute("updateSound(" + soundId + "," + JSON.stringify(entity.getCoords(true)) + ")");
        }
        catch (e) {
            delete attachedSounds[soundId];
        }
    }
}, 50);
// /ceval mp.events.call('sound:play', 0, 'crawling_male_1', 'mp3', 1, true, JSON.stringify(mp.players.local.position))
// /ceval mp.events.call('sound:attach', 0, 0, 0, 62, JSON.stringify(new mp.Vector3(0,0,0.1)), JSON.stringify(new mp.Vector3(0,0,0)))

}
sound.js
{
/**
  @license
  Apache License 2.0 https://github.com/ReactiveX/RxJS/blob/master/LICENSE.txt
 **/
/**
  @license
  Apache License 2.0 https://github.com/ReactiveX/RxJS/blob/master/LICENSE.txt
 **/
/*
 *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
*****************************************************************************/
(function(g,y){"object"===typeof exports&&"undefined"!==typeof module?y(exports):"function"===typeof define&&define.amd?define("rxjs",["exports"],y):y(g.rxjs={})})(this,function(g){function y(b,a){function c(){this.constructor=b}if("function"!==typeof a&&null!==a)throw new TypeError("Class extends value "+String(a)+" is not a constructor or null");Ta(b,a);b.prototype=null===a?Object.create(a):(c.prototype=a.prototype,new c)}function Zd(b,a){var c={},d;for(d in b)Object.prototype.hasOwnProperty.call(b,
d)&&0>a.indexOf(d)&&(c[d]=b[d]);if(null!=b&&"function"===typeof Object.getOwnPropertySymbols){var e=0;for(d=Object.getOwnPropertySymbols(b);e<d.length;e++)0>a.indexOf(d[e])&&Object.prototype.propertyIsEnumerable.call(b,d[e])&&(c[d[e]]=b[d[e]])}return c}function $d(b,a,c,d){function e(a){return a instanceof c?a:new c(function(b){b(a)})}return new (c||(c=Promise))(function(c,h){function f(a){try{z(d.next(a))}catch(v){h(v)}}function k(a){try{z(d["throw"](a))}catch(v){h(v)}}function z(a){a.done?c(a.value):
e(a.value).then(f,k)}z((d=d.apply(b,a||[])).next())})}function Ua(b,a){function c(a){return function(b){return d([a,b])}}function d(c){if(f)throw new TypeError("Generator is already executing.");for(;e;)try{if(f=1,h&&(l=c[0]&2?h["return"]:c[0]?h["throw"]||((l=h["return"])&&l.call(h),0):h.next)&&!(l=l.call(h,c[1])).done)return l;if(h=0,l)c=[c[0]&2,l.value];switch(c[0]){case 0:case 1:l=c;break;case 4:return e.label++,{value:c[1],done:!1};case 5:e.label++;h=c[1];c=[0];continue;case 7:c=e.ops.pop();e.trys.pop();
continue;default:if(!(l=e.trys,l=0<l.length&&l[l.length-1])&&(6===c[0]||2===c[0])){e=0;continue}if(3===c[0]&&(!l||c[1]>l[0]&&c[1]<l[3]))e.label=c[1];else if(6===c[0]&&e.label<l[1])e.label=l[1],l=c;else if(l&&e.label<l[2])e.label=l[2],e.ops.push(c);else{l[2]&&e.ops.pop();e.trys.pop();continue}}c=a.call(b,e)}catch(p){c=[6,p],h=0}finally{f=l=0}if(c[0]&5)throw c[1];return{value:c[0]?c[1]:void 0,done:!0}}var e={label:0,sent:function(){if(l[0]&1)throw l[1];return l[1]},trys:[],ops:[]},f,h,l,k;return k=
{next:c(0),"throw":c(1),"return":c(2)},"function"===typeof Symbol&&(k[Symbol.iterator]=function(){return this}),k}function F(b){var a="function"===typeof Symbol&&Symbol.iterator,c=a&&b[a],d=0;if(c)return c.call(b);if(b&&"number"===typeof b.length)return{next:function(){b&&d>=b.length&&(b=void 0);return{value:b&&b[d++],done:!b}}};throw new TypeError(a?"Object is not iterable.":"Symbol.iterator is not defined.");}function w(b,a){var c="function"===typeof Symbol&&b[Symbol.iterator];if(!c)return b;b=
c.call(b);var d,e=[],f;try{for(;(void 0===a||0<a--)&&!(d=b.next()).done;)e.push(d.value)}catch(h){f={error:h}}finally{try{d&&!d.done&&(c=b["return"])&&c.call(b)}finally{if(f)throw f.error;}}return e}function x(b,a,c){if(c||2===arguments.length)for(var d=0,e=a.length,f;d<e;d++)!f&&d in a||(f||(f=Array.prototype.slice.call(a,0,d)),f[d]=a[d]);return b.concat(f||Array.prototype.slice.call(a))}function ca(b){return this instanceof ca?(this.v=b,this):new ca(b)}function ae(b,a,c){function d(a){k[a]&&(z[a]=
function(c){return new Promise(function(b,d){1<p.push([a,c,b,d])||e(a,c)})})}function e(a,c){try{var b=k[a](c);b.value instanceof ca?Promise.resolve(b.value.v).then(f,h):l(p[0][2],b)}catch(u){l(p[0][3],u)}}function f(a){e("next",a)}function h(a){e("throw",a)}function l(a,c){(a(c),p.shift(),p.length)&&e(p[0][0],p[0][1])}if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var k=c.apply(b,a||[]),z,p=[];return z={},d("next"),d("throw"),d("return"),z[Symbol.asyncIterator]=
function(){return this},z}function be(b){function a(a){e[a]=b[a]&&function(d){return new Promise(function(e,f){d=b[a](d);c(e,f,d.done,d.value)})}}function c(a,c,b,d){Promise.resolve(d).then(function(c){a({value:c,done:b})},c)}if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var d=b[Symbol.asyncIterator],e;return d?d.call(b):(b="function"===typeof F?F(b):b[Symbol.iterator](),e={},a("next"),a("throw"),a("return"),e[Symbol.asyncIterator]=function(){return this},e)}
function t(b){return"function"===typeof b}function R(b){b=b(function(a){Error.call(a);a.stack=Error().stack});b.prototype=Object.create(Error.prototype);return b.prototype.constructor=b}function M(b,a){b&&(a=b.indexOf(a),0<=a&&b.splice(a,1))}function Ib(b){return b instanceof D||b&&"closed"in b&&t(b.remove)&&t(b.add)&&t(b.unsubscribe)}function Jb(b){da.setTimeout(function(){var a=S.onUnhandledError;if(a)a(b);else throw b;})}function C(){}function J(b,a,c){return{kind:b,value:a,error:c}}function Ba(b){if(S.useDeprecatedSynchronousErrorHandling){var a=
!U;a&&(U={errorThrown:!1,error:null});b();if(a&&(a=U,b=a.errorThrown,a=a.error,U=null,b))throw a;}else b()}function Ca(b){S.useDeprecatedSynchronousErrorHandling?S.useDeprecatedSynchronousErrorHandling&&U&&(U.errorThrown=!0,U.error=b):Jb(b)}function Wa(b,a){var c=S.onStoppedNotification;c&&da.setTimeout(function(){return c(b,a)})}function E(b){return b}function Xa(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return Kb(b)}function Kb(b){return 0===b.length?E:1===b.length?b[0]:function(a){return b.reduce(function(a,
b){return b(a)},a)}}function Lb(b){var a;return null!==(a=null!==b&&void 0!==b?b:S.Promise)&&void 0!==a?a:Promise}function ce(b){var a;(a=b&&b instanceof na)||(a=b&&t(b.next)&&t(b.error)&&t(b.complete)&&Ib(b));return a}function n(b){return function(a){if(t(null===a||void 0===a?void 0:a.lift))return a.lift(function(a){try{return b(a,this)}catch(d){this.error(d)}});throw new TypeError("Unable to lift unknown Observable type");}}function m(b,a,c,d,e){return new Ya(b,a,c,d,e)}function Za(){return n(function(b,
a){var c=null;b._refCount++;var d=m(a,void 0,void 0,void 0,function(){if(!b||0>=b._refCount||0<--b._refCount)c=null;else{var d=b._connection,f=c;c=null;!d||f&&d!==f||d.unsubscribe();a.unsubscribe()}});b.subscribe(d);d.closed||(c=b.connect())})}function Mb(b){return new r(function(a){var c=b||Da,d=c.now(),e=0,f=function(){a.closed||(e=N.requestAnimationFrame(function(h){e=0;var l=c.now();a.next({timestamp:b?l:h,elapsed:l-d});f()}))};f();return function(){e&&N.cancelAnimationFrame(e)}})}function Nb(b){return b in
$a?(delete $a[b],!0):!1}function de(b){return new r(function(a){return b.schedule(function(){return a.complete()})})}function Ea(b){return b&&t(b.schedule)}function oa(b){return t(b[b.length-1])?b.pop():void 0}function O(b){return Ea(b[b.length-1])?b.pop():void 0}function Ob(b){return Symbol.asyncIterator&&t(null===b||void 0===b?void 0:b[Symbol.asyncIterator])}function Pb(b){return new TypeError("You provided "+(null!==b&&"object"===typeof b?"an invalid object":"'"+b+"'")+" where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.")}
function Qb(b){return t(null===b||void 0===b?void 0:b[ab])}function Rb(b){return ae(this,arguments,function(){var a,c,d,e;return Ua(this,function(f){switch(f.label){case 0:a=b.getReader(),f.label=1;case 1:f.trys.push([1,,9,10]),f.label=2;case 2:return[4,ca(a.read())];case 3:return c=f.sent(),d=c.value,(e=c.done)?[4,ca(void 0)]:[3,5];case 4:return[2,f.sent()];case 5:return[4,ca(d)];case 6:return[4,f.sent()];case 7:return f.sent(),[3,2];case 8:return[3,10];case 9:return a.releaseLock(),[7];case 10:return[2]}})})}
function q(b){if(b instanceof r)return b;if(null!=b){if(t(b[pa]))return ee(b);if(bb(b))return fe(b);if(t(null===b||void 0===b?void 0:b.then))return ge(b);if(Ob(b))return Sb(b);if(Qb(b))return he(b);if(t(null===b||void 0===b?void 0:b.getReader))return Sb(Rb(b))}throw Pb(b);}function ee(b){return new r(function(a){var c=b[pa]();if(t(c.subscribe))return c.subscribe(a);throw new TypeError("Provided object does not correctly implement Symbol.observable");})}function fe(b){return new r(function(a){for(var c=
0;c<b.length&&!a.closed;c++)a.next(b[c]);a.complete()})}function ge(b){return new r(function(a){b.then(function(c){a.closed||(a.next(c),a.complete())},function(c){return a.error(c)}).then(null,Jb)})}function he(b){return new r(function(a){var c,d;try{for(var e=F(b),f=e.next();!f.done;f=e.next())if(a.next(f.value),a.closed)return}catch(h){c={error:h}}finally{try{f&&!f.done&&(d=e.return)&&d.call(e)}finally{if(c)throw c.error;}}a.complete()})}function Sb(b){return new r(function(a){ie(b,a).catch(function(c){return a.error(c)})})}
function ie(b,a){var c,d,e,f;return $d(this,void 0,void 0,function(){var h,l;return Ua(this,function(k){switch(k.label){case 0:k.trys.push([0,5,6,11]),c=be(b),k.label=1;case 1:return[4,c.next()];case 2:if(d=k.sent(),d.done)return[3,4];h=d.value;a.next(h);if(a.closed)return[2];k.label=3;case 3:return[3,1];case 4:return[3,11];case 5:return l=k.sent(),e={error:l},[3,11];case 6:return k.trys.push([6,,9,10]),d&&!d.done&&(f=c.return)?[4,f.call(c)]:[3,8];case 7:k.sent(),k.label=8;case 8:return[3,10];case 9:if(e)throw e.error;
return[7];case 10:return[7];case 11:return a.complete(),[2]}})})}function G(b,a,c,d,e){void 0===d&&(d=0);void 0===e&&(e=!1);a=a.schedule(function(){c();e?b.add(this.schedule(null,d)):this.unsubscribe()},d);b.add(a);if(!e)return a}function qa(b,a){void 0===a&&(a=0);return n(function(c,d){c.subscribe(m(d,function(c){return G(d,b,function(){return d.next(c)},a)},function(){return G(d,b,function(){return d.complete()},a)},function(c){return G(d,b,function(){return d.error(c)},a)}))})}function ra(b,a){void 0===
a&&(a=0);return n(function(c,d){d.add(b.schedule(function(){return c.subscribe(d)},a))})}function je(b,a){return new r(function(c){var d=0;return a.schedule(function(){d===b.length?c.complete():(c.next(b[d++]),c.closed||this.schedule())})})}function Tb(b,a){return new r(function(c){var d;G(c,a,function(){d=b[ab]();G(c,a,function(){var a,b,h;try{a=d.next(),b=a.value,h=a.done}catch(l){c.error(l);return}h?c.complete():c.next(b)},0,!0)});return function(){return t(null===d||void 0===d?void 0:d.return)&&
d.return()}})}function Ub(b,a){if(!b)throw Error("Iterable cannot be null");return new r(function(c){G(c,a,function(){var d=b[Symbol.asyncIterator]();G(c,a,function(){d.next().then(function(a){a.done?c.complete():c.next(a.value)})},0,!0)})})}function Vb(b,a){if(null!=b){if(t(b[pa]))return q(b).pipe(ra(a),qa(a));if(bb(b))return je(b,a);if(t(null===b||void 0===b?void 0:b.then))return q(b).pipe(ra(a),qa(a));if(Ob(b))return Ub(b,a);if(Qb(b))return Tb(b,a);if(t(null===b||void 0===b?void 0:b.getReader))return Ub(Rb(b),
a)}throw Pb(b);}function P(b,a){return a?Vb(b,a):q(b)}function cb(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];a=O(b);return P(b,a)}function Wb(b,a){var c=t(b)?b:function(){return b},d=function(a){return a.error(c())};return new r(a?function(c){return a.schedule(d,0,c)}:d)}function Fa(b,a){var c,d,e,f=b.kind,h=b.value;b=b.error;if("string"!==typeof f)throw new TypeError('Invalid notification, missing "kind"');"N"===f?null===(c=a.next)||void 0===c?void 0:c.call(a,h):"E"===f?null===(d=
a.error)||void 0===d?void 0:d.call(a,b):null===(e=a.complete)||void 0===e?void 0:e.call(a)}function db(b){return b instanceof Date&&!isNaN(b)}function eb(b,a){b=db(b)?{first:b}:"number"===typeof b?{each:b}:b;var c=b.first,d=b.each,e=b.with,f=void 0===e?ke:e,e=b.scheduler,h=void 0===e?null!==a&&void 0!==a?a:I:e;a=b.meta;var l=void 0===a?null:a;if(null==c&&null==d)throw new TypeError("No timeout provided.");return n(function(a,b){var e,k,z=null,g=0,u=function(a){k=G(b,h,function(){try{e.unsubscribe(),
q(f({meta:l,lastValue:z,seen:g})).subscribe(b)}catch(V){b.error(V)}},a)};e=a.subscribe(m(b,function(a){null===k||void 0===k?void 0:k.unsubscribe();g++;b.next(z=a);0<d&&u(d)},void 0,void 0,function(){(null===k||void 0===k?0:k.closed)||(null===k||void 0===k?void 0:k.unsubscribe());z=null}));!g&&u(null!=c?"number"===typeof c?c:+c-h.now():d)})}function ke(b){throw new Xb(b);}function Q(b,a){return n(function(c,d){var e=0;c.subscribe(m(d,function(c){d.next(b.call(a,c,e++))}))})}function W(b){return Q(function(a){return le(a)?
b.apply(void 0,x([],w(a))):b(a)})}function Ga(b,a,c,d){if(c)if(Ea(c))d=c;else return function(){for(var e=[],f=0;f<arguments.length;f++)e[f]=arguments[f];return Ga(b,a,d).apply(this,e).pipe(W(c))};return d?function(){for(var c=[],f=0;f<arguments.length;f++)c[f]=arguments[f];return Ga(b,a).apply(this,c).pipe(ra(d),qa(d))}:function(){for(var c=this,d=[],h=0;h<arguments.length;h++)d[h]=arguments[h];var l=new fb,k=!0;return new r(function(e){e=l.subscribe(e);if(k){var f=k=!1,h=!1;a.apply(c,x(x([],w(d)),
[function(){for(var a=[],c=0;c<arguments.length;c++)a[c]=arguments[c];if(b&&(c=a.shift(),null!=c)){l.error(c);return}l.next(1<a.length?a:a[0]);h=!0;f&&l.complete()}]));h&&l.complete();f=!0}return e})}}function Yb(b){if(1===b.length){var a=b[0];if(me(a))return{args:a,keys:null};if(a&&"object"===typeof a&&ne(a)===oe)return b=pe(a),{args:b.map(function(c){return a[c]}),keys:b}}return{args:b,keys:null}}function Zb(b,a){return b.reduce(function(c,b,e){return c[b]=a[e],c},{})}function $b(){for(var b=[],
a=0;a<arguments.length;a++)b[a]=arguments[a];var c=O(b),a=oa(b),b=Yb(b),d=b.args,e=b.keys;if(0===d.length)return P([],c);c=new r(ac(d,c,e?function(a){return Zb(e,a)}:E));return a?c.pipe(W(a)):c}function ac(b,a,c){void 0===c&&(c=E);return function(d){bc(a,function(){for(var e=b.length,f=Array(e),h=e,l=e,k=function(e){bc(a,function(){var k=!1;P(b[e],a).subscribe(m(d,function(a){f[e]=a;k||(k=!0,l--);l||d.next(c(f.slice()))},function(){--h||d.complete()}))},d)},g=0;g<e;g++)k(g)},d)}}function bc(b,a,c){b?
G(c,b,a):a()}function gb(b,a,c,d,e,f,h,l){var k=[],g=0,p=0,v=!1,B=function(a){return g<d?n(a):k.push(a)},n=function(b){f&&a.next(b);g++;var l=!1;q(c(b,p++)).subscribe(m(a,function(c){null===e||void 0===e?void 0:e(c);f?B(c):a.next(c)},function(){l=!0},void 0,function(){if(l)try{g--;for(var c=function(){var c=k.shift();h?G(a,h,function(){return n(c)}):n(c)};k.length&&g<d;)c();!v||k.length||g||a.complete()}catch(X){a.error(X)}}))};b.subscribe(m(a,B,function(){v=!0;!v||k.length||g||a.complete()}));return function(){null===
l||void 0===l?void 0:l()}}function H(b,a,c){void 0===c&&(c=Infinity);if(t(a))return H(function(c,e){return Q(function(b,d){return a(c,b,e,d)})(q(b(c,e)))},c);"number"===typeof a&&(c=a);return n(function(a,e){return gb(a,e,b,c)})}function sa(b){void 0===b&&(b=Infinity);return H(E,b)}function Ha(){return sa(1)}function ta(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return Ha()(P(b,O(b)))}function Ia(b){return new r(function(a){q(b()).subscribe(a)})}function hb(b,a,c,d){t(c)&&(d=c,c=
void 0);if(d)return hb(b,a,c).pipe(W(d));d=w(qe(b)?re.map(function(d){return function(e){return b[d](a,e,c)}}):se(b)?te.map(cc(b,a)):ue(b)?ve.map(cc(b,a)):[],2);var e=d[0],f=d[1];if(!e&&bb(b))return H(function(b){return hb(b,a,c)})(q(b));if(!e)throw new TypeError("Invalid event target");return new r(function(a){var c=function(){for(var c=[],b=0;b<arguments.length;b++)c[b]=arguments[b];return a.next(1<c.length?c:c[0])};e(c);return function(){return f(c)}})}function cc(b,a){return function(c){return function(d){return b[c](a,
d)}}}function se(b){return t(b.addListener)&&t(b.removeListener)}function ue(b){return t(b.on)&&t(b.off)}function qe(b){return t(b.addEventListener)&&t(b.removeEventListener)}function dc(b,a,c){return c?dc(b,a).pipe(W(c)):new r(function(c){var d=function(){for(var a=[],b=0;b<arguments.length;b++)a[b]=arguments[b];return c.next(1===a.length?a[0]:a)},f=b(d);return t(a)?function(){return a(d,f)}:void 0})}function Y(b,a,c){void 0===b&&(b=0);void 0===c&&(c=ib);var d=-1;null!=a&&(Ea(a)?c=a:d=a);return new r(function(a){var e=
db(b)?+b-c.now():b;0>e&&(e=0);var h=0;return c.schedule(function(){a.closed||(a.next(h++),0<=d?this.schedule(void 0,d):a.complete())},e)})}function ec(b,a){void 0===b&&(b=0);void 0===a&&(a=I);0>b&&(b=0);return Y(b,b,a)}function Z(b){return 1===b.length&&we(b[0])?b[0]:b}function fc(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];var c=Z(b);return new r(function(a){var b=0,d=function(){if(b<c.length){var e=void 0;try{e=q(c[b++])}catch(k){d();return}var f=new Ya(a,void 0,C,C);e.subscribe(f);
f.add(d)}else a.complete()};d()})}function gc(b,a){return function(c,d){return!b.call(a,c,d)}}function K(b,a){return n(function(c,d){var e=0;c.subscribe(m(d,function(c){return b.call(a,c,e++)&&d.next(c)}))})}function hc(b){return function(a){for(var c=[],d=function(d){c.push(q(b[d]).subscribe(m(a,function(b){if(c){for(var e=0;e<c.length;e++)e!==d&&c[e].unsubscribe();c=null}a.next(b)})))},e=0;c&&!a.closed&&e<b.length;e++)d(e)}}function jb(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];
var c=oa(b),d=Z(b);return d.length?new r(function(a){var b=d.map(function(){return[]}),e=d.map(function(){return!1});a.add(function(){b=e=null});for(var l=function(f){q(d[f]).subscribe(m(a,function(d){b[f].push(d);b.every(function(a){return a.length})&&(d=b.map(function(a){return a.shift()}),a.next(c?c.apply(void 0,x([],w(d))):d),b.some(function(a,c){return!a.length&&e[c]})&&a.complete())},function(){e[f]=!0;!b[f].length&&a.complete()}))},k=0;!a.closed&&k<d.length;k++)l(k);return function(){b=e=null}}):
L}function kb(b){return n(function(a,c){var d=!1,e=null,f=null,h=!1,l=function(){null===f||void 0===f?void 0:f.unsubscribe();f=null;if(d){d=!1;var a=e;e=null;c.next(a)}h&&c.complete()},k=function(){f=null;h&&c.complete()};a.subscribe(m(c,function(a){d=!0;e=a;f||q(b(a)).subscribe(f=m(c,l,k))},function(){h=!0;d&&f&&!f.closed||c.complete()}))})}function ic(b,a){void 0===a&&(a=I);return kb(function(){return Y(b,a)})}function jc(b){return n(function(a,c){var d=[];a.subscribe(m(c,function(a){return d.push(a)},
function(){c.next(d);c.complete()}));q(b).subscribe(m(c,function(){var a=d;d=[];c.next(a)},C));return function(){d=null}})}function kc(b,a){void 0===a&&(a=null);a=null!==a&&void 0!==a?a:b;return n(function(c,d){var e=[],f=0;c.subscribe(m(d,function(c){var h,k,g,p,v=null;0===f++%a&&e.push([]);try{for(var m=F(e),n=m.next();!n.done;n=m.next()){var u=n.value;u.push(c);b<=u.length&&(v=null!==v&&void 0!==v?v:[],v.push(u))}}catch(X){h={error:X}}finally{try{n&&!n.done&&(k=m.return)&&k.call(m)}finally{if(h)throw h.error;
}}if(v)try{for(var ea=F(v),V=ea.next();!V.done;V=ea.next())u=V.value,M(e,u),d.next(u)}catch(X){g={error:X}}finally{try{V&&!V.done&&(p=ea.return)&&p.call(ea)}finally{if(g)throw g.error;}}},function(){var a,c;try{for(var b=F(e),f=b.next();!f.done;f=b.next())d.next(f.value)}catch(p){a={error:p}}finally{try{f&&!f.done&&(c=b.return)&&c.call(b)}finally{if(a)throw a.error;}}d.complete()},void 0,function(){e=null}))})}function lc(b){for(var a,c,d=[],e=1;e<arguments.length;e++)d[e-1]=arguments[e];var f=null!==
(a=O(d))&&void 0!==a?a:I,h=null!==(c=d[0])&&void 0!==c?c:null,l=d[1]||Infinity;return n(function(a,c){var d=[],e=!1,k=function(a){var b=a.buffer;a.subs.unsubscribe();M(d,a);c.next(b);e&&g()},g=function(){if(d){var a=new D;c.add(a);var e={buffer:[],subs:a};d.push(e);G(a,f,function(){return k(e)},b)}};null!==h&&0<=h?G(c,f,g,h,!0):e=!0;g();var z=m(c,function(a){var c,b,e=d.slice();try{for(var f=F(e),h=f.next();!h.done;h=f.next()){var g=h.value,p=g.buffer;p.push(a);l<=p.length&&k(g)}}catch(ze){c={error:ze}}finally{try{h&&
!h.done&&(b=f.return)&&b.call(f)}finally{if(c)throw c.error;}}},function(){for(;null===d||void 0===d?0:d.length;)c.next(d.shift().buffer);null===z||void 0===z?void 0:z.unsubscribe();c.complete();c.unsubscribe()},void 0,function(){return d=null});a.subscribe(z)})}function mc(b,a){return n(function(c,d){var e=[];q(b).subscribe(m(d,function(c){var b=[];e.push(b);var f=new D;f.add(q(a(c)).subscribe(m(d,function(){M(e,b);d.next(b);f.unsubscribe()},C)))},C));c.subscribe(m(d,function(a){var c,b;try{for(var d=
F(e),f=d.next();!f.done;f=d.next())f.value.push(a)}catch(p){c={error:p}}finally{try{f&&!f.done&&(b=d.return)&&b.call(d)}finally{if(c)throw c.error;}}},function(){for(;0<e.length;)d.next(e.shift());d.complete()}))})}function nc(b){return n(function(a,c){var d=null,e=null,f=function(){null===e||void 0===e?void 0:e.unsubscribe();var a=d;d=[];a&&c.next(a);q(b()).subscribe(e=m(c,f,C))};f();a.subscribe(m(c,function(a){return null===d||void 0===d?void 0:d.push(a)},function(){d&&c.next(d);c.complete()},void 0,
function(){return d=e=null}))})}function lb(b){return n(function(a,c){var d=null,e=!1,f,d=a.subscribe(m(c,void 0,void 0,function(h){f=q(b(h,lb(b)(a)));d?(d.unsubscribe(),d=null,f.subscribe(c)):e=!0}));e&&(d.unsubscribe(),d=null,f.subscribe(c))})}function oc(b,a,c,d,e){return function(f,h){var l=c,k=a,g=0;f.subscribe(m(h,function(a){var c=g++;k=l?b(k,a,c):(l=!0,a);d&&h.next(k)},e&&function(){l&&h.next(k);h.complete()}))}}function fa(b,a){return n(oc(b,a,2<=arguments.length,!1,!0))}function mb(){return n(function(b,
a){fa(Ae,[])(b).subscribe(a)})}function pc(b,a){return Xa(mb(),H(function(a){return b(a)}),a?W(a):E)}function Ja(b){return pc($b,b)}function nb(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return(a=oa(b))?Xa(nb.apply(void 0,x([],w(b))),W(a)):n(function(a,d){ac(x([a],w(Z(b))))(d)})}function qc(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return nb.apply(void 0,x([],w(b)))}function Ka(b,a){return t(a)?H(b,a,1):H(b,1)}function rc(b,a){return t(a)?Ka(function(){return b},
a):Ka(function(){return b})}function sc(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];var c=O(b);return n(function(a,e){Ha()(P(x([a],w(b)),c)).subscribe(e)})}function tc(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return sc.apply(void 0,x([],w(b)))}function Be(b){return new r(function(a){return b.subscribe(a)})}function La(b,a){void 0===a&&(a=Ce);var c=a.connector;return n(function(a,e){var d=c();q(b(Be(d))).subscribe(e);e.add(a.subscribe(d))})}function uc(b){return fa(function(a,
c,d){return!b||b(c,d)?a+1:a},0)}function vc(b){return n(function(a,c){var d=!1,e=null,f=null,h=function(){null===f||void 0===f?void 0:f.unsubscribe();f=null;if(d){d=!1;var a=e;e=null;c.next(a)}};a.subscribe(m(c,function(a){null===f||void 0===f?void 0:f.unsubscribe();d=!0;e=a;f=m(c,h,C);q(b(a)).subscribe(f)},function(){h();c.complete()},void 0,function(){e=f=null}))})}function wc(b,a){void 0===a&&(a=I);return n(function(c,d){function e(){var c=l+b,e=a.now();e<c?(f=this.schedule(void 0,c-e),d.add(f)):
k()}var f=null,h=null,l=null,k=function(){if(f){f.unsubscribe();f=null;var a=h;h=null;d.next(a)}};c.subscribe(m(d,function(c){h=c;l=a.now();f||(f=a.schedule(e,b),d.add(f))},function(){k();d.complete()},void 0,function(){h=f=null}))})}function ua(b){return n(function(a,c){var d=!1;a.subscribe(m(c,function(a){d=!0;c.next(a)},function(){d||c.next(b);c.complete()}))})}function ga(b){return 0>=b?function(){return L}:n(function(a,c){var d=0;a.subscribe(m(c,function(a){++d<=b&&(c.next(a),b<=d&&c.complete())}))})}
function ob(){return n(function(b,a){b.subscribe(m(a,C))})}function pb(b){return Q(function(){return b})}function Ma(b,a){return a?function(c){return ta(a.pipe(ga(1),ob()),c.pipe(Ma(b)))}:H(function(a,d){return q(b(a,d)).pipe(ga(1),pb(a))})}function xc(b,a){void 0===a&&(a=I);var c=Y(b,a);return Ma(function(){return c})}function yc(){return n(function(b,a){b.subscribe(m(a,function(c){return Fa(c,a)}))})}function zc(b,a){return n(function(c,d){var e=new Set;c.subscribe(m(d,function(a){var c=b?b(a):
a;e.has(c)||(e.add(c),d.next(a))}));a&&q(a).subscribe(m(d,function(){return e.clear()},C))})}function qb(b,a){void 0===a&&(a=E);b=null!==b&&void 0!==b?b:De;return n(function(c,d){var e,f=!0;c.subscribe(m(d,function(c){var h=a(c);if(f||!b(e,h))f=!1,e=h,d.next(c)}))})}function De(b,a){return b===a}function Ac(b,a){return qb(function(c,d){return a?a(c[b],d[b]):c[b]===d[b]})}function va(b){void 0===b&&(b=Ee);return n(function(a,c){var d=!1;a.subscribe(m(c,function(a){d=!0;c.next(a)},function(){return d?
c.complete():c.error(b())}))})}function Ee(){return new aa}function Bc(b,a){if(0>b)throw new rb;var c=2<=arguments.length;return function(d){return d.pipe(K(function(a,c){return c===b}),ga(1),c?ua(a):va(function(){return new rb}))}}function Cc(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return function(a){return ta(a,cb.apply(void 0,x([],w(b))))}}function Dc(b,a){return n(function(c,d){var e=0;c.subscribe(m(d,function(f){b.call(a,f,e++,c)||(d.next(!1),d.complete())},function(){d.next(!0);
d.complete()}))})}function Na(b,a){return a?function(c){return c.pipe(Na(function(c,e){return q(b(c,e)).pipe(Q(function(b,d){return a(c,b,e,d)}))}))}:n(function(a,d){var c=0,f=null,h=!1;a.subscribe(m(d,function(a){f||(f=m(d,void 0,function(){f=null;h&&d.complete()}),q(b(a,c++)).subscribe(f))},function(){h=!0;!f&&d.complete()}))})}function Oa(){return Na(E)}function Ec(b,a,c){void 0===a&&(a=Infinity);a=1>(a||0)?Infinity:a;return n(function(d,e){return gb(d,e,b,a,void 0,!0,c)})}function Fc(b){return n(function(a,
c){try{a.subscribe(c)}finally{c.add(b)}})}function Gc(b,a){return n(Hc(b,a,"value"))}function Hc(b,a,c){var d="index"===c;return function(c,f){var e=0;c.subscribe(m(f,function(h){var l=e++;b.call(a,h,l,c)&&(f.next(d?l:h),f.complete())},function(){f.next(d?-1:void 0);f.complete()}))}}function Ic(b,a){return n(Hc(b,a,"index"))}function Jc(b,a){var c=2<=arguments.length;return function(d){return d.pipe(b?K(function(a,c){return b(a,c,d)}):E,ga(1),c?ua(a):va(function(){return new aa}))}}function Kc(b,
a,c,d){return n(function(e,f){function h(a,c){var b=new r(function(a){v++;var b=c.subscribe(a);return function(){b.unsubscribe();0===--v&&n&&Va.unsubscribe()}});b.key=a;return b}var l;a&&"function"!==typeof a?(c=a.duration,l=a.element,d=a.connector):l=a;var k=new Map,g=function(a){k.forEach(a);a(f)},p=function(a){return g(function(c){return c.error(a)})},v=0,n=!1,Va=new Ya(f,function(a){try{var e=b(a),g=k.get(e);if(!g){k.set(e,g=d?d():new A);var z=h(e,g);f.next(z);if(c){var v=m(g,function(){g.complete();
null===v||void 0===v?void 0:v.unsubscribe()},void 0,void 0,function(){return k.delete(e)});Va.add(q(c(z)).subscribe(v))}}g.next(l?l(a):a)}catch(xe){p(xe)}},function(){return g(function(a){return a.complete()})},p,function(){return k.clear()},function(){n=!0;return 0===v});e.subscribe(Va)})}function Lc(){return n(function(b,a){b.subscribe(m(a,function(){a.next(!1);a.complete()},function(){a.next(!0);a.complete()}))})}function sb(b){return 0>=b?function(){return L}:n(function(a,c){var d=[];a.subscribe(m(c,
function(a){d.push(a);b<d.length&&d.shift()},function(){var a,b;try{for(var h=F(d),l=h.next();!l.done;l=h.next())c.next(l.value)}catch(k){a={error:k}}finally{try{l&&!l.done&&(b=h.return)&&b.call(h)}finally{if(a)throw a.error;}}c.complete()},void 0,function(){d=null}))})}function Mc(b,a){var c=2<=arguments.length;return function(d){return d.pipe(b?K(function(a,c){return b(a,c,d)}):E,sb(1),c?ua(a):va(function(){return new aa}))}}function Nc(){return n(function(b,a){b.subscribe(m(a,function(c){a.next(Pa.createNext(c))},
function(){a.next(Pa.createComplete());a.complete()},function(c){a.next(Pa.createError(c));a.complete()}))})}function Oc(b){return fa(t(b)?function(a,c){return 0<b(a,c)?a:c}:function(a,c){return a>c?a:c})}function Pc(b,a,c){void 0===c&&(c=Infinity);if(t(a))return H(function(){return b},a,c);"number"===typeof a&&(c=a);return H(function(){return b},c)}function Qc(b,a,c){void 0===c&&(c=Infinity);return n(function(d,e){var f=a;return gb(d,e,function(a,c){return b(f,a,c)},c,function(a){f=a},!1,void 0,
function(){return f=null})})}function Rc(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];var c=O(b),d="number"===typeof b[b.length-1]?b.pop():Infinity,b=Z(b);return n(function(a,f){sa(d)(P(x([a],w(b)),c)).subscribe(f)})}function Sc(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return Rc.apply(void 0,x([],w(b)))}function Tc(b){return fa(t(b)?function(a,c){return 0>b(a,c)?a:c}:function(a,c){return a<c?a:c})}function Qa(b,a){var c=t(b)?b:function(){return b};return t(a)?La(a,
{connector:c}):function(a){return new Ra(a,c)}}function Uc(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];var c=Z(b);return function(a){return fc.apply(void 0,x([a],w(c)))}}function Vc(){return n(function(b,a){var c,d=!1;b.subscribe(m(a,function(b){var e=c;c=b;d&&a.next([e,b]);d=!0}))})}function Wc(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];var c=b.length;if(0===c)throw Error("list of properties cannot be empty.");return Q(function(a){var d=a;for(a=0;a<c;a++)if(d=null===
d||void 0===d?void 0:d[b[a]],"undefined"===typeof d)return;return d})}function Xc(b){return b?function(a){return La(b)(a)}:function(a){return Qa(new A)(a)}}function Yc(b){return function(a){var c=new Zc(b);return new Ra(a,function(){return c})}}function $c(){return function(b){var a=new fb;return new Ra(b,function(){return a})}}function ad(b,a,c,d){c&&!t(c)&&(d=c);var e=t(c)?c:void 0;return function(c){return Qa(new ha(b,a,d),e)(c)}}function tb(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];
return b.length?n(function(a,d){hc(x([a],w(b)))(d)}):E}function bd(b){var a,c=Infinity,d;null!=b&&("object"===typeof b?(a=b.count,c=void 0===a?Infinity:a,d=b.delay):c=b);return 0>=c?function(){return L}:n(function(a,b){var e=0,f,k=function(){null===f||void 0===f?void 0:f.unsubscribe();f=null;if(null!=d){var a="number"===typeof d?Y(d):q(d(e)),c=m(b,function(){c.unsubscribe();g()});a.subscribe(c)}else g()},g=function(){var d=!1;f=a.subscribe(m(b,void 0,function(){++e<c?f?k():d=!0:b.complete()}));d&&
k()};g()})}function cd(b){return n(function(a,c){var d,e=!1,f,h=!1,l=!1,k=function(){f||(f=new A,q(b(f)).subscribe(m(c,function(){d?g():e=!0},function(){h=!0;l&&h&&c.complete()})));return f},g=function(){l=!1;d=a.subscribe(m(c,void 0,function(){(l=!0,h)&&(c.complete(),!0)||k().next()}));e&&(d.unsubscribe(),d=null,e=!1,g())};g()})}function dd(b){void 0===b&&(b=Infinity);b=b&&"object"===typeof b?b:{count:b};var a=b.count,c=void 0===a?Infinity:a,d=b.delay;b=b.resetOnSuccess;var e=void 0===b?!1:b;return 0>=
c?E:n(function(a,b){var f=0,h,g=function(){var l=!1;h=a.subscribe(m(b,function(a){e&&(f=0);b.next(a)},void 0,function(a){if(f++<c){var e=function(){h?(h.unsubscribe(),h=null,g()):l=!0};if(null!=d){a="number"===typeof d?Y(d):q(d(a,f));var k=m(b,function(){k.unsubscribe();e()},function(){b.complete()});a.subscribe(k)}else e()}else b.error(a)}));l&&(h.unsubscribe(),h=null,g())};g()})}function ed(b){return n(function(a,c){var d,e=!1,f,h=function(){d=a.subscribe(m(c,void 0,void 0,function(a){f||(f=new A,
q(b(f)).subscribe(m(c,function(){return d?h():e=!0})));f&&f.next(a)}));e&&(d.unsubscribe(),d=null,e=!1,h())};h()})}function ub(b){return n(function(a,c){var d=!1,e=null;a.subscribe(m(c,function(a){d=!0;e=a}));q(b).subscribe(m(c,function(){if(d){d=!1;var a=e;e=null;c.next(a)}},C))})}function fd(b,a){void 0===a&&(a=I);return ub(ec(b,a))}function gd(b,a){return n(oc(b,a,2<=arguments.length,!0))}function hd(b,a){void 0===a&&(a=function(a,b){return a===b});return n(function(c,d){var e={buffer:[],complete:!1},
f={buffer:[],complete:!1},h=function(c,b){var e=m(d,function(e){var f=b.buffer,h=b.complete;0===f.length?h?(d.next(!1),d.complete()):c.buffer.push(e):a(e,f.shift())||(d.next(!1),d.complete())},function(){c.complete=!0;var a=b.buffer;b.complete&&(d.next(0===a.length),d.complete());null===e||void 0===e?void 0:e.unsubscribe()});return e};c.subscribe(h(e,f));q(b).subscribe(h(f,e))})}function vb(b){void 0===b&&(b={});var a=b.connector,c=void 0===a?function(){return new A}:a,a=b.resetOnError,d=void 0===
a?!0:a,a=b.resetOnComplete,e=void 0===a?!0:a;b=b.resetOnRefCountZero;var f=void 0===b?!0:b;return function(a){var b,h,g,p=0,v=!1,m=!1,t=function(){null===h||void 0===h?void 0:h.unsubscribe();h=void 0},u=function(){t();b=g=void 0;v=m=!1},ea=function(){var a=b;u();null===a||void 0===a?void 0:a.unsubscribe()};return n(function(a,l){p++;m||v||t();var k=g=null!==g&&void 0!==g?g:c();l.add(function(){p--;0!==p||m||v||(h=wb(ea,f))});k.subscribe(l);!b&&0<p&&(b=new ia({next:function(a){return k.next(a)},error:function(a){m=
!0;t();h=wb(u,d,a);k.error(a)},complete:function(){v=!0;t();h=wb(u,e);k.complete()}}),q(a).subscribe(b))})(a)}}function wb(b,a){for(var c=[],d=2;d<arguments.length;d++)c[d-2]=arguments[d];if(!0===a)b();else if(!1!==a){var e=new ia({next:function(){e.unsubscribe();b()}});return q(a.apply(void 0,x([],w(c)))).subscribe(e)}}function id(b,a,c){var d,e;d=!1;b&&"object"===typeof b?(d=b.bufferSize,e=void 0===d?Infinity:d,d=b.windowTime,a=void 0===d?Infinity:d,d=b.refCount,d=void 0===d?!1:d,c=b.scheduler):
e=null!==b&&void 0!==b?b:Infinity;return vb({connector:function(){return new ha(e,a,c)},resetOnError:!0,resetOnComplete:!1,resetOnRefCountZero:d})}function jd(b){return n(function(a,c){var d=!1,e,f=!1,h=0;a.subscribe(m(c,function(l){f=!0;if(!b||b(l,h++,a))d&&c.error(new kd("Too many matching values")),d=!0,e=l},function(){d?(c.next(e),c.complete()):c.error(f?new ld("No matching values"):new aa)}))})}function md(b){return K(function(a,c){return b<=c})}function nd(b){return 0>=b?E:n(function(a,c){var d=
Array(b),e=0;a.subscribe(m(c,function(a){var f=e++;if(f<b)d[f]=a;else{var f=f%b,l=d[f];d[f]=a;c.next(l)}}));return function(){d=null}})}function od(b){return n(function(a,c){var d=!1,e=m(c,function(){null===e||void 0===e?void 0:e.unsubscribe();d=!0},C);q(b).subscribe(e);a.subscribe(m(c,function(a){return d&&c.next(a)}))})}function pd(b){return n(function(a,c){var d=!1,e=0;a.subscribe(m(c,function(a){return(d||(d=!b(a,e++)))&&c.next(a)}))})}function qd(){for(var b=[],a=0;a<arguments.length;a++)b[a]=
arguments[a];var c=O(b);return n(function(a,e){(c?ta(b,a,c):ta(b,a)).subscribe(e)})}function ja(b,a){return n(function(c,d){var e=null,f=0,h=!1;c.subscribe(m(d,function(c){null===e||void 0===e?void 0:e.unsubscribe();var l=0,g=f++;q(b(c,g)).subscribe(e=m(d,function(b){return d.next(a?a(c,b,g,l++):b)},function(){e=null;h&&!e&&d.complete()}))},function(){(h=!0,!e)&&d.complete()}))})}function rd(){return ja(E)}function sd(b,a){return t(a)?ja(function(){return b},a):ja(function(){return b})}function td(b,
a){return n(function(c,d){var e=a;ja(function(a,c){return b(e,a,c)},function(a,c){return e=c,c})(c).subscribe(d);return function(){e=null}})}function ud(b){return n(function(a,c){q(b).subscribe(m(c,function(){return c.complete()},C));!c.closed&&a.subscribe(c)})}function vd(b,a){void 0===a&&(a=!1);return n(function(c,d){var e=0;c.subscribe(m(d,function(c){var f=b(c,e++);(f||a)&&d.next(c);!f&&d.complete()}))})}function wd(b,a,c){var d=t(b)||a||c?{next:b,error:a,complete:c}:b;return d?n(function(a,c){var b;
null===(b=d.subscribe)||void 0===b?void 0:b.call(d);var e=!0;a.subscribe(m(c,function(a){var b;null===(b=d.next)||void 0===b?void 0:b.call(d,a);c.next(a)},function(){var a;e=!1;null===(a=d.complete)||void 0===a?void 0:a.call(d);c.complete()},function(a){var b;e=!1;null===(b=d.error)||void 0===b?void 0:b.call(d,a);c.error(a)},function(){var a,c;e&&(null===(a=d.unsubscribe)||void 0===a?void 0:a.call(d));null===(c=d.finalize)||void 0===c?void 0:c.call(d)}))}):E}function xb(b,a){return n(function(c,d){var e=
null!==a&&void 0!==a?a:{},f=e.leading,h=void 0===f?!0:f,e=e.trailing,l=void 0===e?!1:e,g=!1,z=null,p=null,v=!1,n=function(){null===p||void 0===p?void 0:p.unsubscribe();p=null;l&&(u(),v&&d.complete())},t=function(){p=null;v&&d.complete()},u=function(){if(g){g=!1;var a=z;z=null;d.next(a);!v&&(p=q(b(a)).subscribe(m(d,n,t)))}};c.subscribe(m(d,function(a){g=!0;z=a;(!p||p.closed)&&(h?u():p=q(b(a)).subscribe(m(d,n,t)))},function(){v=!0;l&&g&&p&&!p.closed||d.complete()}))})}function xd(b,a,c){void 0===a&&
(a=I);var d=Y(b,a);return xb(function(){return d},c)}function yd(b){void 0===b&&(b=I);return n(function(a,c){var d=b.now();a.subscribe(m(c,function(a){var e=b.now(),h=e-d;d=e;c.next(new Fe(a,h))}))})}function zd(b,a,c){var d,e;c=null!==c&&void 0!==c?c:ib;db(b)?d=b:"number"===typeof b&&(e=b);if(a)b=function(){return a};else throw new TypeError("No observable provided to switch to");if(null==d&&null==e)throw new TypeError("No timeout provided.");return eb({first:d,each:e,scheduler:c,with:b})}function Ad(b){void 0===
b&&(b=ka);return Q(function(a){return{value:a,timestamp:b.now()}})}function Bd(b){return n(function(a,c){var d=new A;c.next(d.asObservable());var e=function(a){d.error(a);c.error(a)};a.subscribe(m(c,function(a){return null===d||void 0===d?void 0:d.next(a)},function(){d.complete();c.complete()},e));q(b).subscribe(m(c,function(){d.complete();c.next(d=new A)},C,e));return function(){null===d||void 0===d?void 0:d.unsubscribe();d=null}})}function Cd(b,a){void 0===a&&(a=0);var c=0<a?a:b;return n(function(a,
e){var d=[new A],h=0;e.next(d[0].asObservable());a.subscribe(m(e,function(a){var f,l;try{for(var g=F(d),v=g.next();!v.done;v=g.next())v.value.next(a)}catch(B){f={error:B}}finally{try{v&&!v.done&&(l=g.return)&&l.call(g)}finally{if(f)throw f.error;}}a=h-b+1;0<=a&&0===a%c&&d.shift().complete();0===++h%c&&(a=new A,d.push(a),e.next(a.asObservable()))},function(){for(;0<d.length;)d.shift().complete();e.complete()},function(a){for(;0<d.length;)d.shift().error(a);e.error(a)},function(){d=null}))})}function Dd(b){for(var a,
c,d=[],e=1;e<arguments.length;e++)d[e-1]=arguments[e];var f=null!==(a=O(d))&&void 0!==a?a:I,h=null!==(c=d[0])&&void 0!==c?c:null,g=d[1]||Infinity;return n(function(a,c){var d=[],e=!1,l=function(a){var c=a.subs;a.window.complete();c.unsubscribe();M(d,a);e&&k()},k=function(){if(d){var a=new D;c.add(a);var e=new A,h={window:e,subs:a,seen:0};d.push(h);c.next(e.asObservable());G(a,f,function(){return l(h)},b)}};null!==h&&0<=h?G(c,f,k,h,!0):e=!0;k();var n=function(a){d.slice().forEach(function(c){return a(c.window)});
a(c);c.unsubscribe()};a.subscribe(m(c,function(a){d.slice().forEach(function(c){c.window.next(a);g<=++c.seen&&l(c)})},function(){return n(function(a){return a.complete()})},function(a){return n(function(c){return c.error(a)})}));return function(){d=null}})}function Ed(b,a){return n(function(c,d){var e=[],f=function(a){for(;0<e.length;)e.shift().error(a);d.error(a)};q(b).subscribe(m(d,function(c){var b=new A;e.push(b);var h=new D,g;try{g=q(a(c))}catch(p){f(p);return}d.next(b.asObservable());h.add(g.subscribe(m(d,
function(){M(e,b);b.complete();h.unsubscribe()},C,f)))},C));c.subscribe(m(d,function(a){var c,b,d=e.slice();try{for(var f=F(d),h=f.next();!h.done;h=f.next())h.value.next(a)}catch(B){c={error:B}}finally{try{h&&!h.done&&(b=f.return)&&b.call(f)}finally{if(c)throw c.error;}}},function(){for(;0<e.length;)e.shift().complete();d.complete()},f,function(){for(;0<e.length;)e.shift().unsubscribe()}))})}function Fd(b){return n(function(a,c){var d,e,f=function(a){d.error(a);c.error(a)},h=function(){null===e||
void 0===e?void 0:e.unsubscribe();null===d||void 0===d?void 0:d.complete();d=new A;c.next(d.asObservable());var a;try{a=q(b())}catch(k){f(k);return}a.subscribe(e=m(c,h,h,f))};h();a.subscribe(m(c,function(a){return d.next(a)},function(){d.complete();c.complete()},f,function(){null===e||void 0===e?void 0:e.unsubscribe();d=null}))})}function Gd(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];var c=oa(b);return n(function(a,e){for(var d=b.length,h=Array(d),g=b.map(function(){return!1}),k=
!1,n=function(a){q(b[a]).subscribe(m(e,function(c){h[a]=c;k||g[a]||(g[a]=!0,(k=g.every(E))&&(g=null))},C))},p=0;p<d;p++)n(p);a.subscribe(m(e,function(a){k&&(a=x([a],w(h)),e.next(c?c.apply(void 0,x([],w(a))):a))}))})}function Hd(b){return pc(jb,b)}function Id(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return n(function(a,d){jb.apply(void 0,x([a],w(b))).subscribe(d)})}function Jd(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return Id.apply(void 0,x([],w(b)))}function Kd(b,
a){for(var c=0,d=a.length;c<d;c++)for(var e=a[c],f=Object.getOwnPropertyNames(e.prototype),h=0,g=f.length;h<g;h++){var k=f[h];b.prototype[k]=e.prototype[k]}}function Ld(b){switch(b.responseType){case "json":return"response"in b?b.response:JSON.parse(b.responseText);case "document":return b.responseXML;default:return"response"in b?b.response:b.responseText}}function Ge(b,a){return ba({method:"GET",url:b,headers:a})}function He(b,a,c){return ba({method:"POST",url:b,body:a,headers:c})}function Ie(b,
a){return ba({method:"DELETE",url:b,headers:a})}function Je(b,a,c){return ba({method:"PUT",url:b,body:a,headers:c})}function Ke(b,a,c){return ba({method:"PATCH",url:b,body:a,headers:c})}function Le(b,a){return Me(ba({method:"GET",url:b,headers:a}))}function Ne(b){return new r(function(a){var c,d,e=T({async:!0,crossDomain:!1,withCredentials:!1,method:"GET",timeout:0,responseType:"json"},b),f=e.queryParams,h=e.body,g=e.headers,k=e.url;if(!k)throw new TypeError("url is required");if(f){var m;if(k.includes("?")){k=
k.split("?");if(2<k.length)throw new TypeError("invalid url");m=new URLSearchParams(k[1]);(new URLSearchParams(f)).forEach(function(a,c){return m.set(c,a)});k=k[0]+"?"+m}else m=new URLSearchParams(f),k=k+"?"+m}f={};if(g)for(var p in g)g.hasOwnProperty(p)&&(f[p.toLowerCase()]=g[p]);var n=e.crossDomain;n||"x-requested-with"in f||(f["x-requested-with"]="XMLHttpRequest");var t=e.xsrfCookieName,g=e.xsrfHeaderName;(e.withCredentials||!n)&&t&&g&&(n=null!==(d=null===(c=null===document||void 0===document?
void 0:document.cookie.match(new RegExp("(^|;\\s*)("+t+")\x3d([^;]*)")))||void 0===c?void 0:c.pop())&&void 0!==d?d:"")&&(f[g]=n);c=Oe(h,f);var q=T(T({},e),{url:k,headers:f,body:c}),u;u=b.createXHR?b.createXHR():new XMLHttpRequest;var r=b.progressSubscriber,e=b.includeDownloadProgress,e=void 0===e?!1:e;d=b.includeUploadProgress;d=void 0===d?!1:d;h=function(c,b){u.addEventListener(c,function(){var c,d=b();null===(c=null===r||void 0===r?void 0:r.error)||void 0===c?void 0:c.call(r,d);a.error(d)})};h("timeout",
function(){return new Md(u,q)});h("abort",function(){return new wa("aborted",u,q)});var w=function(c,b,d){c.addEventListener(b,function(c){a.next(new yb(c,u,q,d+"_"+c.type))})};d&&[zb,Ab,Nd].forEach(function(a){return w(u.upload,a,Pe)});r&&[zb,Ab].forEach(function(a){return u.upload.addEventListener(a,function(a){var c;return null===(c=null===r||void 0===r?void 0:r.next)||void 0===c?void 0:c.call(r,a)})});e&&[zb,Ab].forEach(function(a){return w(u,a,Od)});var x=function(c){a.error(new wa("ajax error"+
(c?" "+c:""),u,q))};u.addEventListener("error",function(a){var c;null===(c=null===r||void 0===r?void 0:r.error)||void 0===c?void 0:c.call(r,a);x()});u.addEventListener(Nd,function(c){var b,d,e=u.status;if(400>e){null===(b=null===r||void 0===r?void 0:r.complete)||void 0===b?void 0:b.call(r);b=void 0;try{b=new yb(c,u,q,Od+"_"+c.type)}catch(ye){a.error(ye);return}a.next(b);a.complete()}else null===(d=null===r||void 0===r?void 0:r.error)||void 0===d?void 0:d.call(r,c),x(e)});e=q.user;d=q.method;h=q.async;
e?u.open(d,k,h,e,q.password):u.open(d,k,h);h&&(u.timeout=q.timeout,u.responseType=q.responseType);"withCredentials"in u&&(u.withCredentials=q.withCredentials);for(p in f)f.hasOwnProperty(p)&&u.setRequestHeader(p,f[p]);c?u.send(c):u.send();return function(){u&&4!==u.readyState&&u.abort()}})}function Oe(b,a){var c;if(!b||"string"===typeof b||"undefined"!==typeof FormData&&b instanceof FormData||"undefined"!==typeof URLSearchParams&&b instanceof URLSearchParams||Bb(b,"ArrayBuffer")||Bb(b,"File")||Bb(b,
"Blob")||"undefined"!==typeof ReadableStream&&b instanceof ReadableStream)return b;if("undefined"!==typeof ArrayBuffer&&ArrayBuffer.isView(b))return b.buffer;if("object"===typeof b)return a["content-type"]=null!==(c=a["content-type"])&&void 0!==c?c:"application/json;charset\x3dutf-8",JSON.stringify(b);throw new TypeError("Unknown body type");}function Bb(b,a){return Qe.call(b)==="[object "+a+"]"}var Ta=function(b,a){Ta=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,b){a.__proto__=
b}||function(a,b){for(var c in b)Object.prototype.hasOwnProperty.call(b,c)&&(a[c]=b[c])};return Ta(b,a)},T=function(){T=Object.assign||function(b){for(var a,c=1,d=arguments.length;c<d;c++){a=arguments[c];for(var e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b[e]=a[e])}return b};return T.apply(this,arguments)},Sa=R(function(b){return function(a){b(this);this.message=a?a.length+" errors occurred during unsubscription:\n"+a.map(function(a,b){return b+1+") "+a.toString()}).join("\n  "):"";this.name=
"UnsubscriptionError";this.errors=a}}),D=function(){function b(a){this.initialTeardown=a;this.closed=!1;this._finalizers=this._parentage=null}b.prototype.unsubscribe=function(){var a,c,b,e,f;if(!this.closed){this.closed=!0;var h=this._parentage;if(h)if(this._parentage=null,Array.isArray(h))try{for(var g=F(h),k=g.next();!k.done;k=g.next())k.value.remove(this)}catch(B){a={error:B}}finally{try{k&&!k.done&&(c=g.return)&&c.call(g)}finally{if(a)throw a.error;}}else h.remove(this);a=this.initialTeardown;
if(t(a))try{a()}catch(B){f=B instanceof Sa?B.errors:[B]}if(a=this._finalizers){this._finalizers=null;try{for(var m=F(a),p=m.next();!p.done;p=m.next()){var n=p.value;try{a=n,t(a)?a():a.unsubscribe()}catch(B){f=null!==f&&void 0!==f?f:[],B instanceof Sa?f=x(x([],w(f)),w(B.errors)):f.push(B)}}}catch(B){b={error:B}}finally{try{p&&!p.done&&(e=m.return)&&e.call(m)}finally{if(b)throw b.error;}}}if(f)throw new Sa(f);}};b.prototype.add=function(a){var c;if(a&&a!==this)if(this.closed)t(a)?a():a.unsubscribe();
else{if(a instanceof b){if(a.closed||a._hasParent(this))return;a._addParent(this)}(this._finalizers=null!==(c=this._finalizers)&&void 0!==c?c:[]).push(a)}};b.prototype._hasParent=function(a){var c=this._parentage;return c===a||Array.isArray(c)&&c.includes(a)};b.prototype._addParent=function(a){var c=this._parentage;this._parentage=Array.isArray(c)?(c.push(a),c):c?[c,a]:a};b.prototype._removeParent=function(a){var c=this._parentage;c===a?this._parentage=null:Array.isArray(c)&&M(c,a)};b.prototype.remove=
function(a){var c=this._finalizers;c&&M(c,a);a instanceof b&&a._removeParent(this)};b.EMPTY=function(){var a=new b;a.closed=!0;return a}();return b}(),Pd=D.EMPTY,S={onUnhandledError:null,onStoppedNotification:null,Promise:void 0,useDeprecatedSynchronousErrorHandling:!1,useDeprecatedNextContext:!1},da={setTimeout:function(b,a){for(var c=[],d=2;d<arguments.length;d++)c[d-2]=arguments[d];d=da.delegate;return(null===d||void 0===d?0:d.setTimeout)?d.setTimeout.apply(d,x([b,a],w(c))):setTimeout.apply(void 0,
x([b,a],w(c)))},clearTimeout:function(b){var a=da.delegate;return((null===a||void 0===a?void 0:a.clearTimeout)||clearTimeout)(b)},delegate:void 0},xa=J("C",void 0,void 0),U=null,na=function(b){function a(a){var c=b.call(this)||this;c.isStopped=!1;a?(c.destination=a,Ib(a)&&a.add(c)):c.destination=Re;return c}y(a,b);a.create=function(a,b,e){return new ia(a,b,e)};a.prototype.next=function(a){this.isStopped?Wa(J("N",a,void 0),this):this._next(a)};a.prototype.error=function(a){this.isStopped?Wa(J("E",
void 0,a),this):(this.isStopped=!0,this._error(a))};a.prototype.complete=function(){this.isStopped?Wa(xa,this):(this.isStopped=!0,this._complete())};a.prototype.unsubscribe=function(){this.closed||(this.isStopped=!0,b.prototype.unsubscribe.call(this),this.destination=null)};a.prototype._next=function(a){this.destination.next(a)};a.prototype._error=function(a){try{this.destination.error(a)}finally{this.unsubscribe()}};a.prototype._complete=function(){try{this.destination.complete()}finally{this.unsubscribe()}};
return a}(D),Cb=Function.prototype.bind,Se=function(){function b(a){this.partialObserver=a}b.prototype.next=function(a){var c=this.partialObserver;if(c.next)try{c.next(a)}catch(d){Ca(d)}};b.prototype.error=function(a){var c=this.partialObserver;if(c.error)try{c.error(a)}catch(d){Ca(d)}else Ca(a)};b.prototype.complete=function(){var a=this.partialObserver;if(a.complete)try{a.complete()}catch(c){Ca(c)}};return b}(),ia=function(b){function a(a,d,e){var c=b.call(this)||this;t(a)||!a?a={next:null!==a&&
void 0!==a?a:void 0,error:null!==d&&void 0!==d?d:void 0,complete:null!==e&&void 0!==e?e:void 0}:c&&S.useDeprecatedNextContext&&(d=Object.create(a),d.unsubscribe=function(){return c.unsubscribe()},a={next:a.next&&Cb.call(a.next,d),error:a.error&&Cb.call(a.error,d),complete:a.complete&&Cb.call(a.complete,d)});c.destination=new Se(a);return c}y(a,b);return a}(na),Re={closed:!0,next:C,error:function(b){throw b;},complete:C},pa="function"===typeof Symbol&&Symbol.observable||"@@observable",r=function(){function b(a){a&&
(this._subscribe=a)}b.prototype.lift=function(a){var c=new b;c.source=this;c.operator=a;return c};b.prototype.subscribe=function(a,c,b){var d=this,f=ce(a)?a:new ia(a,c,b);Ba(function(){var a=d.operator,c=d.source;f.add(a?a.call(f,c):c?d._subscribe(f):d._trySubscribe(f))});return f};b.prototype._trySubscribe=function(a){try{return this._subscribe(a)}catch(c){a.error(c)}};b.prototype.forEach=function(a,c){var b=this;c=Lb(c);return new c(function(c,d){var e=new ia({next:function(c){try{a(c)}catch(k){d(k),
e.unsubscribe()}},error:d,complete:c});b.subscribe(e)})};b.prototype._subscribe=function(a){var c;return null===(c=this.source)||void 0===c?void 0:c.subscribe(a)};b.prototype[pa]=function(){return this};b.prototype.pipe=function(){for(var a=[],c=0;c<arguments.length;c++)a[c]=arguments[c];return Kb(a)(this)};b.prototype.toPromise=function(a){var c=this;a=Lb(a);return new a(function(a,b){var d;c.subscribe(function(a){return d=a},function(a){return b(a)},function(){return a(d)})})};b.create=function(a){return new b(a)};
return b}(),Ya=function(b){function a(a,d,e,f,h,g){var c=b.call(this,a)||this;c.onFinalize=h;c.shouldUnsubscribe=g;c._next=d?function(c){try{d(c)}catch(p){a.error(p)}}:b.prototype._next;c._error=f?function(c){try{f(c)}catch(p){a.error(p)}finally{this.unsubscribe()}}:b.prototype._error;c._complete=e?function(){try{e()}catch(z){a.error(z)}finally{this.unsubscribe()}}:b.prototype._complete;return c}y(a,b);a.prototype.unsubscribe=function(){var a;if(!this.shouldUnsubscribe||this.shouldUnsubscribe()){var d=
this.closed;b.prototype.unsubscribe.call(this);!d&&(null===(a=this.onFinalize)||void 0===a?void 0:a.call(this))}};return a}(na),Ra=function(b){function a(a,d){var c=b.call(this)||this;c.source=a;c.subjectFactory=d;c._subject=null;c._refCount=0;c._connection=null;t(null===a||void 0===a?void 0:a.lift)&&(c.lift=a.lift);return c}y(a,b);a.prototype._subscribe=function(a){return this.getSubject().subscribe(a)};a.prototype.getSubject=function(){var a=this._subject;if(!a||a.isStopped)this._subject=this.subjectFactory();
return this._subject};a.prototype._teardown=function(){this._refCount=0;var a=this._connection;this._subject=this._connection=null;null===a||void 0===a?void 0:a.unsubscribe()};a.prototype.connect=function(){var a=this,b=this._connection;if(!b){var b=this._connection=new D,e=this.getSubject();b.add(this.source.subscribe(m(e,void 0,function(){a._teardown();e.complete()},function(b){a._teardown();e.error(b)},function(){return a._teardown()})));b.closed&&(this._connection=null,b=D.EMPTY)}return b};a.prototype.refCount=
function(){return Za()(this)};return a}(r),Da={now:function(){return(Da.delegate||performance).now()},delegate:void 0},N={schedule:function(b){var a=requestAnimationFrame,c=cancelAnimationFrame,d=N.delegate;d&&(a=d.requestAnimationFrame,c=d.cancelAnimationFrame);var e=a(function(a){c=void 0;b(a)});return new D(function(){return null===c||void 0===c?void 0:c(e)})},requestAnimationFrame:function(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];a=N.delegate;return((null===a||void 0===a?void 0:
a.requestAnimationFrame)||requestAnimationFrame).apply(void 0,x([],w(b)))},cancelAnimationFrame:function(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];a=N.delegate;return((null===a||void 0===a?void 0:a.cancelAnimationFrame)||cancelAnimationFrame).apply(void 0,x([],w(b)))},delegate:void 0},Te=Mb(),Qd=R(function(b){return function(){b(this);this.name="ObjectUnsubscribedError";this.message="object unsubscribed"}}),A=function(b){function a(){var a=b.call(this)||this;a.closed=!1;a.currentObservers=
null;a.observers=[];a.isStopped=!1;a.hasError=!1;a.thrownError=null;return a}y(a,b);a.prototype.lift=function(a){var b=new Db(this,this);b.operator=a;return b};a.prototype._throwIfClosed=function(){if(this.closed)throw new Qd;};a.prototype.next=function(a){var b=this;Ba(function(){var c,d;b._throwIfClosed();if(!b.isStopped){b.currentObservers||(b.currentObservers=Array.from(b.observers));try{for(var h=F(b.currentObservers),g=h.next();!g.done;g=h.next())g.value.next(a)}catch(k){c={error:k}}finally{try{g&&
!g.done&&(d=h.return)&&d.call(h)}finally{if(c)throw c.error;}}}})};a.prototype.error=function(a){var b=this;Ba(function(){b._throwIfClosed();if(!b.isStopped){b.hasError=b.isStopped=!0;b.thrownError=a;for(var c=b.observers;c.length;)c.shift().error(a)}})};a.prototype.complete=function(){var a=this;Ba(function(){a._throwIfClosed();if(!a.isStopped){a.isStopped=!0;for(var b=a.observers;b.length;)b.shift().complete()}})};a.prototype.unsubscribe=function(){this.isStopped=this.closed=!0;this.observers=this.currentObservers=
null};Object.defineProperty(a.prototype,"observed",{get:function(){var a;return 0<(null===(a=this.observers)||void 0===a?void 0:a.length)},enumerable:!1,configurable:!0});a.prototype._trySubscribe=function(a){this._throwIfClosed();return b.prototype._trySubscribe.call(this,a)};a.prototype._subscribe=function(a){this._throwIfClosed();this._checkFinalizedStatuses(a);return this._innerSubscribe(a)};a.prototype._innerSubscribe=function(a){var b=this,c=this.isStopped,f=this.observers;if(this.hasError||
c)return Pd;this.currentObservers=null;f.push(a);return new D(function(){b.currentObservers=null;M(f,a)})};a.prototype._checkFinalizedStatuses=function(a){var b=this.thrownError,c=this.isStopped;this.hasError?a.error(b):c&&a.complete()};a.prototype.asObservable=function(){var a=new r;a.source=this;return a};a.create=function(a,b){return new Db(a,b)};return a}(r),Db=function(b){function a(a,d){var c=b.call(this)||this;c.destination=a;c.source=d;return c}y(a,b);a.prototype.next=function(a){var b,c;
null===(c=null===(b=this.destination)||void 0===b?void 0:b.next)||void 0===c?void 0:c.call(b,a)};a.prototype.error=function(a){var b,c;null===(c=null===(b=this.destination)||void 0===b?void 0:b.error)||void 0===c?void 0:c.call(b,a)};a.prototype.complete=function(){var a,b;null===(b=null===(a=this.destination)||void 0===a?void 0:a.complete)||void 0===b?void 0:b.call(a)};a.prototype._subscribe=function(a){var b,c;return null!==(c=null===(b=this.source)||void 0===b?void 0:b.subscribe(a))&&void 0!==c?
c:Pd};return a}(A),Zc=function(b){function a(a){var c=b.call(this)||this;c._value=a;return c}y(a,b);Object.defineProperty(a.prototype,"value",{get:function(){return this.getValue()},enumerable:!1,configurable:!0});a.prototype._subscribe=function(a){var c=b.prototype._subscribe.call(this,a);!c.closed&&a.next(this._value);return c};a.prototype.getValue=function(){var a=this.thrownError,b=this._value;if(this.hasError)throw a;this._throwIfClosed();return b};a.prototype.next=function(a){b.prototype.next.call(this,
this._value=a)};return a}(A),ka={now:function(){return(ka.delegate||Date).now()},delegate:void 0},ha=function(b){function a(a,d,e){void 0===a&&(a=Infinity);void 0===d&&(d=Infinity);void 0===e&&(e=ka);var c=b.call(this)||this;c._bufferSize=a;c._windowTime=d;c._timestampProvider=e;c._buffer=[];c._infiniteTimeWindow=Infinity===d;c._bufferSize=Math.max(1,a);c._windowTime=Math.max(1,d);return c}y(a,b);a.prototype.next=function(a){var c=this._buffer,e=this._infiniteTimeWindow,f=this._timestampProvider,
h=this._windowTime;this.isStopped||(c.push(a),!e&&c.push(f.now()+h));this._trimBuffer();b.prototype.next.call(this,a)};a.prototype._subscribe=function(a){this._throwIfClosed();this._trimBuffer();for(var b=this._innerSubscribe(a),c=this._infiniteTimeWindow,f=this._buffer.slice(),h=0;h<f.length&&!a.closed;h+=c?1:2)a.next(f[h]);this._checkFinalizedStatuses(a);return b};a.prototype._trimBuffer=function(){var a=this._bufferSize,b=this._timestampProvider,e=this._buffer,f=this._infiniteTimeWindow,h=(f?1:
2)*a;Infinity>a&&h<e.length&&e.splice(0,e.length-h);if(!f){a=b.now();b=0;for(f=1;f<e.length&&e[f]<=a;f+=2)b=f;b&&e.splice(0,b+1)}};return a}(A),fb=function(b){function a(){var a=null!==b&&b.apply(this,arguments)||this;a._value=null;a._hasValue=!1;a._isComplete=!1;return a}y(a,b);a.prototype._checkFinalizedStatuses=function(a){var b=this._hasValue,c=this._value,f=this.thrownError,h=this.isStopped,g=this._isComplete;if(this.hasError)a.error(f);else if(h||g)b&&a.next(c),a.complete()};a.prototype.next=
function(a){this.isStopped||(this._value=a,this._hasValue=!0)};a.prototype.complete=function(){var a=this._hasValue,d=this._value;this._isComplete||(this._isComplete=!0,a&&b.prototype.next.call(this,d),b.prototype.complete.call(this))};return a}(A),la={setInterval:function(b,a){for(var c=[],d=2;d<arguments.length;d++)c[d-2]=arguments[d];d=la.delegate;return(null===d||void 0===d?0:d.setInterval)?d.setInterval.apply(d,x([b,a],w(c))):setInterval.apply(void 0,x([b,a],w(c)))},clearInterval:function(b){var a=
la.delegate;return((null===a||void 0===a?void 0:a.clearInterval)||clearInterval)(b)},delegate:void 0},ya=function(b){function a(a,d){var c=b.call(this,a,d)||this;c.scheduler=a;c.work=d;c.pending=!1;return c}y(a,b);a.prototype.schedule=function(a,b){var c;void 0===b&&(b=0);if(this.closed)return this;this.state=a;a=this.id;var d=this.scheduler;null!=a&&(this.id=this.recycleAsyncId(d,a,b));this.pending=!0;this.delay=b;this.id=null!==(c=this.id)&&void 0!==c?c:this.requestAsyncId(d,this.id,b);return this};
a.prototype.requestAsyncId=function(a,b,e){void 0===e&&(e=0);return la.setInterval(a.flush.bind(a,this),e)};a.prototype.recycleAsyncId=function(a,b,e){void 0===e&&(e=0);if(null!=e&&this.delay===e&&!1===this.pending)return b;null!=b&&la.clearInterval(b)};a.prototype.execute=function(a,b){if(this.closed)return Error("executing a cancelled action");this.pending=!1;if(a=this._execute(a,b))return a;!1===this.pending&&null!=this.id&&(this.id=this.recycleAsyncId(this.scheduler,this.id,null))};a.prototype._execute=
function(a,b){b=!1;var c;try{this.work(a)}catch(f){b=!0,c=f?f:Error("Scheduled action threw falsy error")}if(b)return this.unsubscribe(),c};a.prototype.unsubscribe=function(){if(!this.closed){var a=this.id,d=this.scheduler,e=d.actions;this.work=this.state=this.scheduler=null;this.pending=!1;M(e,this);null!=a&&(this.id=this.recycleAsyncId(d,a,null));this.delay=null;b.prototype.unsubscribe.call(this)}};return a}(function(b){function a(a,d){return b.call(this)||this}y(a,b);a.prototype.schedule=function(a,
b){return this};return a}(D)),Ue=1,Eb,$a={},Ve=function(b){var a=Ue++;$a[a]=!0;Eb||(Eb=Promise.resolve());Eb.then(function(){return Nb(a)&&b()});return a},We=function(b){Nb(b)},ma={setImmediate:function(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];a=ma.delegate;return((null===a||void 0===a?void 0:a.setImmediate)||Ve).apply(void 0,x([],w(b)))},clearImmediate:function(b){var a=ma.delegate;return((null===a||void 0===a?void 0:a.clearImmediate)||We)(b)},delegate:void 0},Xe=function(b){function a(a,
d){var c=b.call(this,a,d)||this;c.scheduler=a;c.work=d;return c}y(a,b);a.prototype.requestAsyncId=function(a,d,e){void 0===e&&(e=0);if(null!==e&&0<e)return b.prototype.requestAsyncId.call(this,a,d,e);a.actions.push(this);return a._scheduled||(a._scheduled=ma.setImmediate(a.flush.bind(a,void 0)))};a.prototype.recycleAsyncId=function(a,d,e){var c;void 0===e&&(e=0);if(null!=e?0<e:0<this.delay)return b.prototype.recycleAsyncId.call(this,a,d,e);e=a.actions;null!=d&&(null===(c=e[e.length-1])||void 0===
c?void 0:c.id)!==d&&(ma.clearImmediate(d),a._scheduled===d&&(a._scheduled=void 0))};return a}(ya),Fb=function(){function b(a,c){void 0===c&&(c=b.now);this.schedulerActionCtor=a;this.now=c}b.prototype.schedule=function(a,b,d){void 0===b&&(b=0);return(new this.schedulerActionCtor(this,a)).schedule(d,b)};b.now=ka.now;return b}(),za=function(b){function a(a,d){void 0===d&&(d=Fb.now);a=b.call(this,a,d)||this;a.actions=[];a._active=!1;return a}y(a,b);a.prototype.flush=function(a){var b=this.actions;if(this._active)b.push(a);
else{var c;this._active=!0;do if(c=a.execute(a.state,a.delay))break;while(a=b.shift());this._active=!1;if(c){for(;a=b.shift();)a.unsubscribe();throw c;}}};return a}(Fb),Rd=new (function(b){function a(){return null!==b&&b.apply(this,arguments)||this}y(a,b);a.prototype.flush=function(a){this._active=!0;var b=this._scheduled;this._scheduled=void 0;var c=this.actions,f;a=a||c.shift();do if(f=a.execute(a.state,a.delay))break;while((a=c[0])&&a.id===b&&c.shift());this._active=!1;if(f){for(;(a=c[0])&&a.id===
b&&c.shift();)a.unsubscribe();throw f;}};return a}(za))(Xe),I=new za(ya),ib=I,Ye=function(b){function a(a,d){var c=b.call(this,a,d)||this;c.scheduler=a;c.work=d;return c}y(a,b);a.prototype.schedule=function(a,d){void 0===d&&(d=0);if(0<d)return b.prototype.schedule.call(this,a,d);this.delay=d;this.state=a;this.scheduler.flush(this);return this};a.prototype.execute=function(a,d){return 0<d||this.closed?b.prototype.execute.call(this,a,d):this._execute(a,d)};a.prototype.requestAsyncId=function(a,d,e){void 0===
e&&(e=0);if(null!=e&&0<e||null==e&&0<this.delay)return b.prototype.requestAsyncId.call(this,a,d,e);a.flush(this);return 0};return a}(ya),Sd=new (function(b){function a(){return null!==b&&b.apply(this,arguments)||this}y(a,b);return a}(za))(Ye),Ze=function(b){function a(a,d){var c=b.call(this,a,d)||this;c.scheduler=a;c.work=d;return c}y(a,b);a.prototype.requestAsyncId=function(a,d,e){void 0===e&&(e=0);if(null!==e&&0<e)return b.prototype.requestAsyncId.call(this,a,d,e);a.actions.push(this);return a._scheduled||
(a._scheduled=N.requestAnimationFrame(function(){return a.flush(void 0)}))};a.prototype.recycleAsyncId=function(a,d,e){var c;void 0===e&&(e=0);if(null!=e?0<e:0<this.delay)return b.prototype.recycleAsyncId.call(this,a,d,e);e=a.actions;null!=d&&(null===(c=e[e.length-1])||void 0===c?void 0:c.id)!==d&&(N.cancelAnimationFrame(d),a._scheduled=void 0)};return a}(ya),Td=new (function(b){function a(){return null!==b&&b.apply(this,arguments)||this}y(a,b);a.prototype.flush=function(a){this._active=!0;var b=
this._scheduled;this._scheduled=void 0;var c=this.actions,f;a=a||c.shift();do if(f=a.execute(a.state,a.delay))break;while((a=c[0])&&a.id===b&&c.shift());this._active=!1;if(f){for(;(a=c[0])&&a.id===b&&c.shift();)a.unsubscribe();throw f;}};return a}(za))(Ze),Ud=function(b){function a(a,d){void 0===a&&(a=Gb);void 0===d&&(d=Infinity);var c=b.call(this,a,function(){return c.frame})||this;c.maxFrames=d;c.frame=0;c.index=-1;return c}y(a,b);a.prototype.flush=function(){for(var a=this.actions,b=this.maxFrames,
e,f;(f=a[0])&&f.delay<=b&&!(a.shift(),this.frame=f.delay,e=f.execute(f.state,f.delay)););if(e){for(;f=a.shift();)f.unsubscribe();throw e;}};a.frameTimeFactor=10;return a}(za),Gb=function(b){function a(a,d,e){void 0===e&&(e=a.index+=1);var c=b.call(this,a,d)||this;c.scheduler=a;c.work=d;c.index=e;c.active=!0;c.index=a.index=e;return c}y(a,b);a.prototype.schedule=function(c,d){void 0===d&&(d=0);if(Number.isFinite(d)){if(!this.id)return b.prototype.schedule.call(this,c,d);this.active=!1;var e=new a(this.scheduler,
this.work);this.add(e);return e.schedule(c,d)}return D.EMPTY};a.prototype.requestAsyncId=function(b,d,e){void 0===e&&(e=0);this.delay=b.frame+e;b=b.actions;b.push(this);b.sort(a.sortActions);return 1};a.prototype.recycleAsyncId=function(a,b,e){};a.prototype._execute=function(a,d){if(!0===this.active)return b.prototype._execute.call(this,a,d)};a.sortActions=function(a,b){return a.delay===b.delay?a.index===b.index?0:a.index>b.index?1:-1:a.delay>b.delay?1:-1};return a}(ya),L=new r(function(b){return b.complete()}),
bb=function(b){return b&&"number"===typeof b.length&&"function"!==typeof b},ab;ab="function"===typeof Symbol&&Symbol.iterator?Symbol.iterator:"@@iterator";(function(b){b.NEXT="N";b.ERROR="E";b.COMPLETE="C"})(g.NotificationKind||(g.NotificationKind={}));var Pa=function(){function b(a,b,d){this.kind=a;this.value=b;this.error=d;this.hasValue="N"===a}b.prototype.observe=function(a){return Fa(this,a)};b.prototype.do=function(a,b,d){var c=this.kind,f=this.value,h=this.error;return"N"===c?null===a||void 0===
a?void 0:a(f):"E"===c?null===b||void 0===b?void 0:b(h):null===d||void 0===d?void 0:d()};b.prototype.accept=function(a,b,d){return t(null===a||void 0===a?void 0:a.next)?this.observe(a):this.do(a,b,d)};b.prototype.toObservable=function(){var a=this.kind,b=this.value,d=this.error,b="N"===a?cb(b):"E"===a?Wb(function(){return d}):"C"===a?L:0;if(!b)throw new TypeError("Unexpected notification kind "+a);return b};b.createNext=function(a){return new b("N",a)};b.createError=function(a){return new b("E",void 0,
a)};b.createComplete=function(){return b.completeNotification};b.completeNotification=new b("C");return b}(),aa=R(function(b){return function(){b(this);this.name="EmptyError";this.message="no elements in sequence"}}),rb=R(function(b){return function(){b(this);this.name="ArgumentOutOfRangeError";this.message="argument out of range"}}),ld=R(function(b){return function(a){b(this);this.name="NotFoundError";this.message=a}}),kd=R(function(b){return function(a){b(this);this.name="SequenceError";this.message=
a}}),Xb=R(function(b){return function(a){void 0===a&&(a=null);b(this);this.message="Timeout has occurred";this.name="TimeoutError";this.info=a}}),le=Array.isArray,me=Array.isArray,ne=Object.getPrototypeOf,oe=Object.prototype,pe=Object.keys,$e={connector:function(){return new A},resetOnDisconnect:!0},te=["addListener","removeListener"],re=["addEventListener","removeEventListener"],ve=["on","off"],Vd=new r(C),we=Array.isArray,Ae=function(b,a){return b.push(a),b},Ce={connector:function(){return new A}},
Fe=function(){return function(b,a){this.value=b;this.interval=a}}(),af=Object.freeze({audit:kb,auditTime:ic,buffer:jc,bufferCount:kc,bufferTime:lc,bufferToggle:mc,bufferWhen:nc,catchError:lb,combineAll:Ja,combineLatestAll:Ja,combineLatest:nb,combineLatestWith:qc,concat:sc,concatAll:Ha,concatMap:Ka,concatMapTo:rc,concatWith:tc,connect:La,count:uc,debounce:vc,debounceTime:wc,defaultIfEmpty:ua,delay:xc,delayWhen:Ma,dematerialize:yc,distinct:zc,distinctUntilChanged:qb,distinctUntilKeyChanged:Ac,elementAt:Bc,
endWith:Cc,every:Dc,exhaust:Oa,exhaustAll:Oa,exhaustMap:Na,expand:Ec,filter:K,finalize:Fc,find:Gc,findIndex:Ic,first:Jc,groupBy:Kc,ignoreElements:ob,isEmpty:Lc,last:Mc,map:Q,mapTo:pb,materialize:Nc,max:Oc,merge:Rc,mergeAll:sa,flatMap:H,mergeMap:H,mergeMapTo:Pc,mergeScan:Qc,mergeWith:Sc,min:Tc,multicast:Qa,observeOn:qa,onErrorResumeNext:Uc,pairwise:Vc,partition:function(b,a){return function(c){return[K(b,a)(c),K(gc(b,a))(c)]}},pluck:Wc,publish:Xc,publishBehavior:Yc,publishLast:$c,publishReplay:ad,
race:function(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];return tb.apply(void 0,x([],w(Z(b))))},raceWith:tb,reduce:fa,repeat:bd,repeatWhen:cd,retry:dd,retryWhen:ed,refCount:Za,sample:ub,sampleTime:fd,scan:gd,sequenceEqual:hd,share:vb,shareReplay:id,single:jd,skip:md,skipLast:nd,skipUntil:od,skipWhile:pd,startWith:qd,subscribeOn:ra,switchAll:rd,switchMap:ja,switchMapTo:sd,switchScan:td,take:ga,takeLast:sb,takeUntil:ud,takeWhile:vd,tap:wd,throttle:xb,throttleTime:xd,throwIfEmpty:va,
timeInterval:yd,timeout:eb,timeoutWith:zd,timestamp:Ad,toArray:mb,window:Bd,windowCount:Cd,windowTime:Dd,windowToggle:Ed,windowWhen:Fd,withLatestFrom:Gd,zip:Id,zipAll:Hd,zipWith:Jd}),Aa=function(){return function(b,a){void 0===a&&(a=Infinity);this.subscribedFrame=b;this.unsubscribedFrame=a}}(),Wd=function(){function b(){this.subscriptions=[]}b.prototype.logSubscribedFrame=function(){this.subscriptions.push(new Aa(this.scheduler.now()));return this.subscriptions.length-1};b.prototype.logUnsubscribedFrame=
function(a){var b=this.subscriptions;b[a]=new Aa(b[a].subscribedFrame,this.scheduler.now())};return b}(),Hb=function(b){function a(a,d){var c=b.call(this,function(a){var b=this,c=b.logSubscribedFrame(),d=new D;d.add(new D(function(){b.logUnsubscribedFrame(c)}));b.scheduleMessages(a);return d})||this;c.messages=a;c.subscriptions=[];c.scheduler=d;return c}y(a,b);a.prototype.scheduleMessages=function(a){for(var b=this.messages.length,c=0;c<b;c++){var f=this.messages[c];a.add(this.scheduler.schedule(function(a){Fa(a.message.notification,
a.subscriber)},f.frame,{message:f,subscriber:a}))}};return a}(r);Kd(Hb,[Wd]);var Xd=function(b){function a(a,d){var c=b.call(this)||this;c.messages=a;c.subscriptions=[];c.scheduler=d;return c}y(a,b);a.prototype._subscribe=function(a){var c=this,e=c.logSubscribedFrame(),f=new D;f.add(new D(function(){c.logUnsubscribedFrame(e)}));f.add(b.prototype._subscribe.call(this,a));return f};a.prototype.setup=function(){for(var a=this,b=a.messages.length,e=function(b){(function(){var c=a.messages[b],d=c.notification;
a.scheduler.schedule(function(){Fa(d,a)},c.frame)})()},f=0;f<b;f++)e(f)};return a}(A);Kd(Xd,[Wd]);var bf=function(b){function a(a){var c=b.call(this,Gb,750)||this;c.assertDeepEqual=a;c.hotObservables=[];c.coldObservables=[];c.flushTests=[];c.runMode=!1;return c}y(a,b);a.prototype.createTime=function(b){b=this.runMode?b.trim().indexOf("|"):b.indexOf("|");if(-1===b)throw Error('marble diagram for time should have a completion marker "|"');return b*a.frameTimeFactor};a.prototype.createColdObservable=
function(b,d,e){if(-1!==b.indexOf("^"))throw Error('cold observable cannot have subscription offset "^"');if(-1!==b.indexOf("!"))throw Error('cold observable cannot have unsubscription marker "!"');b=a.parseMarbles(b,d,e,void 0,this.runMode);b=new Hb(b,this);this.coldObservables.push(b);return b};a.prototype.createHotObservable=function(b,d,e){if(-1!==b.indexOf("!"))throw Error('hot observable cannot have unsubscription marker "!"');b=a.parseMarbles(b,d,e,void 0,this.runMode);b=new Xd(b,this);this.hotObservables.push(b);
return b};a.prototype.materializeInnerObservable=function(a,b){var c=this,d=[];a.subscribe({next:function(a){d.push({frame:c.frame-b,notification:J("N",a,void 0)})},error:function(a){d.push({frame:c.frame-b,notification:J("E",void 0,a)})},complete:function(){d.push({frame:c.frame-b,notification:xa})}});return d};a.prototype.expectObservable=function(b,d){var c=this;void 0===d&&(d=null);var f=[],g={actual:f,ready:!1};d=a.parseMarblesAsSubscriptions(d,this.runMode);var l=Infinity===d.subscribedFrame?
0:d.subscribedFrame;d=d.unsubscribedFrame;var k;this.schedule(function(){k=b.subscribe({next:function(a){a=a instanceof r?c.materializeInnerObservable(a,c.frame):a;f.push({frame:c.frame,notification:J("N",a,void 0)})},error:function(a){f.push({frame:c.frame,notification:J("E",void 0,a)})},complete:function(){f.push({frame:c.frame,notification:xa})}})},l);Infinity!==d&&this.schedule(function(){return k.unsubscribe()},d);this.flushTests.push(g);var m=this.runMode;return{toBe:function(b,c,d){g.ready=
!0;g.expected=a.parseMarbles(b,c,d,!0,m)},toEqual:function(a){g.ready=!0;g.expected=[];c.schedule(function(){k=a.subscribe({next:function(a){a=a instanceof r?c.materializeInnerObservable(a,c.frame):a;g.expected.push({frame:c.frame,notification:J("N",a,void 0)})},error:function(a){g.expected.push({frame:c.frame,notification:J("E",void 0,a)})},complete:function(){g.expected.push({frame:c.frame,notification:xa})}})},l)}}};a.prototype.expectSubscriptions=function(b){var c={actual:b,ready:!1};this.flushTests.push(c);
var e=this.runMode;return{toBe:function(b){b="string"===typeof b?[b]:b;c.ready=!0;c.expected=b.map(function(b){return a.parseMarblesAsSubscriptions(b,e)}).filter(function(a){return Infinity!==a.subscribedFrame})}}};a.prototype.flush=function(){for(var a=this,d=this.hotObservables;0<d.length;)d.shift().setup();b.prototype.flush.call(this);this.flushTests=this.flushTests.filter(function(b){return b.ready?(a.assertDeepEqual(b.actual,b.expected),!1):!0})};a.parseMarblesAsSubscriptions=function(a,b){var c=
this;void 0===b&&(b=!1);if("string"!==typeof a)return new Aa(Infinity);var d=x([],w(a));a=d.length;for(var g=-1,l=Infinity,k=Infinity,m=0,p=function(a){var e=m,f=function(a){e+=a*c.frameTimeFactor},h=d[a];switch(h){case " ":b||f(1);break;case "-":f(1);break;case "(":g=m;f(1);break;case ")":g=-1;f(1);break;case "^":if(Infinity!==l)throw Error("found a second subscription point '^' in a subscription marble diagram. There can only be one.");l=-1<g?g:m;f(1);break;case "!":if(Infinity!==k)throw Error("found a second unsubscription point '!' in a subscription marble diagram. There can only be one.");
k=-1<g?g:m;break;default:if(b&&h.match(/^[0-9]$/)&&(0===a||" "===d[a-1])){var p=d.slice(a).join("").match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);if(p){a+=p[0].length-1;var h=parseFloat(p[1]),q=void 0;switch(p[2]){case "ms":q=h;break;case "s":q=1E3*h;break;case "m":q=6E4*h}f(q/n.frameTimeFactor);break}}throw Error("there can only be '^' and '!' markers in a subscription marble diagram. Found instead '"+h+"'.");}m=e;r=a},n=this,r,q=0;q<a;q++)p(q),q=r;return 0>k?new Aa(l):new Aa(l,k)};a.parseMarbles=function(a,
b,e,f,g){var c=this;void 0===f&&(f=!1);void 0===g&&(g=!1);if(-1!==a.indexOf("!"))throw Error('conventional marble diagrams cannot have the unsubscription marker "!"');var d=x([],w(a)),h=d.length,p=[];a=g?a.replace(/^[ ]+/,"").indexOf("^"):a.indexOf("^");var m=-1===a?0:a*-this.frameTimeFactor,n="object"!==typeof b?function(a){return a}:function(a){return f&&b[a]instanceof Hb?b[a].messages:b[a]},q=-1;a=function(a){var b=m,f=function(a){b+=a*c.frameTimeFactor},h=void 0,k=d[a];switch(k){case " ":g||f(1);
break;case "-":f(1);break;case "(":q=m;f(1);break;case ")":q=-1;f(1);break;case "|":h=xa;f(1);break;case "^":f(1);break;case "#":h=J("E",void 0,e||"error");f(1);break;default:if(g&&k.match(/^[0-9]$/)&&(0===a||" "===d[a-1])){var l=d.slice(a).join("").match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);if(l){a+=l[0].length-1;var k=parseFloat(l[1]),v=void 0;switch(l[2]){case "ms":v=k;break;case "s":v=1E3*k;break;case "m":v=6E4*k}f(v/r.frameTimeFactor);break}}h=J("N",n(k),void 0);f(1)}h&&p.push({frame:-1<q?q:m,
notification:h});m=b;t=a};for(var r=this,t,y=0;y<h;y++)a(y),y=t;return p};a.prototype.createAnimator=function(){var b=this;if(!this.runMode)throw Error("animate() must only be used in run mode");var d=0,e;return{animate:function(c){var d,f;if(e)throw Error("animate() must not be called more than once within run()");if(/[|#]/.test(c))throw Error("animate() must not complete or error");e=new Map;c=a.parseMarbles(c,void 0,void 0,void 0,!0);try{for(var g=F(c),m=g.next();!m.done;m=g.next())b.schedule(function(){var a,
c,d=b.now(),f=Array.from(e.values());e.clear();try{for(var g=(a=void 0,F(f)),h=g.next();!h.done;h=g.next()){var k=h.value;k(d)}}catch(X){a={error:X}}finally{try{h&&!h.done&&(c=g.return)&&c.call(g)}finally{if(a)throw a.error;}}},m.value.frame)}catch(p){d={error:p}}finally{try{m&&!m.done&&(f=g.return)&&f.call(g)}finally{if(d)throw d.error;}}},delegate:{requestAnimationFrame:function(a){if(!e)throw Error("animate() was not called within run()");var b=++d;e.set(b,a);return b},cancelAnimationFrame:function(a){if(!e)throw Error("animate() was not called within run()");
e.delete(a)}}}};a.prototype.createDelegates=function(){var a=this,b=0,e=new Map,f=function(){var b=a.now(),c=Array.from(e.values()).filter(function(a){return a.due<=b}),d=c.filter(function(a){return"immediate"===a.type});if(0<d.length)d=d[0],c=d.handle,d=d.handler,e.delete(c),d();else if(d=c.filter(function(a){return"interval"===a.type}),0<d.length){var c=d[0],g=c.duration,d=c.handler;c.due=b+g;c.subscription=a.schedule(f,g);d()}else if(c=c.filter(function(a){return"timeout"===a.type}),0<c.length)d=
c[0],c=d.handle,d=d.handler,e.delete(c),d();else throw Error("Expected a due immediate or interval");};return{immediate:{setImmediate:function(c){var d=++b;e.set(d,{due:a.now(),duration:0,handle:d,handler:c,subscription:a.schedule(f,0),type:"immediate"});return d},clearImmediate:function(a){var b=e.get(a);b&&(b.subscription.unsubscribe(),e.delete(a))}},interval:{setInterval:function(c,d){void 0===d&&(d=0);var g=++b;e.set(g,{due:a.now()+d,duration:d,handle:g,handler:c,subscription:a.schedule(f,d),
type:"interval"});return g},clearInterval:function(a){var b=e.get(a);b&&(b.subscription.unsubscribe(),e.delete(a))}},timeout:{setTimeout:function(c,d){void 0===d&&(d=0);var g=++b;e.set(g,{due:a.now()+d,duration:d,handle:g,handler:c,subscription:a.schedule(f,d),type:"timeout"});return g},clearTimeout:function(a){var b=e.get(a);b&&(b.subscription.unsubscribe(),e.delete(a))}}}};a.prototype.run=function(b){var c=a.frameTimeFactor,e=this.maxFrames;a.frameTimeFactor=1;this.maxFrames=Infinity;this.runMode=
!0;var f=this.createAnimator(),g=this.createDelegates();N.delegate=f.delegate;ka.delegate=this;ma.delegate=g.immediate;la.delegate=g.interval;da.delegate=g.timeout;Da.delegate=this;f={cold:this.createColdObservable.bind(this),hot:this.createHotObservable.bind(this),flush:this.flush.bind(this),time:this.createTime.bind(this),expectObservable:this.expectObservable.bind(this),expectSubscriptions:this.expectSubscriptions.bind(this),animate:f.animate};try{var l=b(f);this.flush();return l}finally{a.frameTimeFactor=
c,this.maxFrames=e,this.runMode=!1,N.delegate=void 0,ka.delegate=void 0,ma.delegate=void 0,la.delegate=void 0,da.delegate=void 0,Da.delegate=void 0}};a.frameTimeFactor=10;return a}(Ud),cf=Object.freeze({TestScheduler:bf}),yb=function(){return function(b,a,c,d){void 0===d&&(d="download_load");this.originalEvent=b;this.xhr=a;this.request=c;this.type=d;c=a.status;d=a.responseType;this.status=null!==c&&void 0!==c?c:0;this.responseType=null!==d&&void 0!==d?d:"";this.responseHeaders=(c=a.getAllResponseHeaders())?
c.split("\n").reduce(function(a,b){var c=b.indexOf(": ");a[b.slice(0,c)]=b.slice(c+2);return a},{}):{};this.response=Ld(a);a=b.total;this.loaded=b.loaded;this.total=a}}(),wa=R(function(b){return function(a,b,d){this.message=a;this.name="AjaxError";this.xhr=b;this.request=d;this.status=b.status;this.responseType=b.responseType;var c;try{c=Ld(b)}catch(f){c=b.responseText}this.response=c}}),Md=function(){function b(a,b){wa.call(this,"ajax timeout",a,b);this.name="AjaxTimeoutError";return this}b.prototype=
Object.create(wa.prototype);return b}(),Me=Q(function(b){return b.response}),ba=function(){var b=function(a){return Ne("string"===typeof a?{url:a}:a)};b.get=Ge;b.post=He;b.delete=Ie;b.put=Je;b.patch=Ke;b.getJSON=Le;return b}(),Pe="upload",Od="download",zb="loadstart",Ab="progress",Nd="load",Qe=Object.prototype.toString,df=Object.freeze({ajax:ba,AjaxError:wa,AjaxTimeoutError:Md,AjaxResponse:yb}),ef={url:"",deserializer:function(b){return JSON.parse(b.data)},serializer:function(b){return JSON.stringify(b)}},
Yd=function(b){function a(a,d){var c=b.call(this)||this;c._socket=null;if(a instanceof r)c.destination=d,c.source=a;else{d=c._config=T({},ef);c._output=new A;if("string"===typeof a)d.url=a;else for(var f in a)a.hasOwnProperty(f)&&(d[f]=a[f]);if(!d.WebSocketCtor&&WebSocket)d.WebSocketCtor=WebSocket;else if(!d.WebSocketCtor)throw Error("no WebSocket constructor can be found");c.destination=new ha}return c}y(a,b);a.prototype.lift=function(b){var c=new a(this._config,this.destination);c.operator=b;c.source=
this;return c};a.prototype._resetState=function(){this._socket=null;this.source||(this.destination=new ha);this._output=new A};a.prototype.multiplex=function(a,b,e){var c=this;return new r(function(d){try{c.next(a())}catch(k){d.error(k)}var f=c.subscribe({next:function(a){try{e(a)&&d.next(a)}catch(z){d.error(z)}},error:function(a){return d.error(a)},complete:function(){return d.complete()}});return function(){try{c.next(b())}catch(k){d.error(k)}f.unsubscribe()}})};a.prototype._connectSocket=function(){var a=
this,b=this._config,e=b.WebSocketCtor,f=b.protocol,g=b.url,b=b.binaryType,l=this._output,k=null;try{this._socket=k=f?new e(g,f):new e(g),b&&(this._socket.binaryType=b)}catch(p){l.error(p);return}var m=new D(function(){a._socket=null;k&&1===k.readyState&&k.close()});k.onopen=function(b){if(a._socket){var c=a._config.openObserver;c&&c.next(b);b=a.destination;a.destination=na.create(function(b){if(1===k.readyState)try{var c=a._config.serializer;k.send(c(b))}catch(u){a.destination.error(u)}},function(b){var c=
a._config.closingObserver;c&&c.next(void 0);b&&b.code?k.close(b.code,b.reason):l.error(new TypeError("WebSocketSubject.error must be called with an object with an error code, and an optional reason: { code: number, reason: string }"));a._resetState()},function(){var b=a._config.closingObserver;b&&b.next(void 0);k.close();a._resetState()});b&&b instanceof ha&&m.add(b.subscribe(a.destination))}else k.close(),a._resetState()};k.onerror=function(b){a._resetState();l.error(b)};k.onclose=function(b){k===
a._socket&&a._resetState();var c=a._config.closeObserver;c&&c.next(b);b.wasClean?l.complete():l.error(b)};k.onmessage=function(b){try{var c=a._config.deserializer;l.next(c(b))}catch(B){l.error(B)}}};a.prototype._subscribe=function(a){var b=this,c=this.source;if(c)return c.subscribe(a);this._socket||this._connectSocket();this._output.subscribe(a);a.add(function(){var a=b._socket;0===b._output.observers.length&&(!a||1!==a.readyState&&0!==a.readyState||a.close(),b._resetState())});return a};a.prototype.unsubscribe=
function(){var a=this._socket;!a||1!==a.readyState&&0!==a.readyState||a.close();this._resetState();b.prototype.unsubscribe.call(this)};return a}(Db),ff=Object.freeze({webSocket:function(b){return new Yd(b)},WebSocketSubject:Yd}),gf=Object.freeze({fromFetch:function(b,a){void 0===a&&(a={});var c=a.selector,d=Zd(a,["selector"]);return new r(function(a){var e=new AbortController,g=e.signal,l=!0,k=d.signal;if(k)if(k.aborted)e.abort();else{var n=function(){g.aborted||e.abort()};k.addEventListener("abort",
n);a.add(function(){return k.removeEventListener("abort",n)})}var p=T(T({},d),{signal:g}),r=function(b){l=!1;a.error(b)};fetch(b,p).then(function(b){c?q(c(b)).subscribe(m(a,void 0,function(){l=!1;a.complete()},r)):(l=!1,a.next(b),a.complete())}).catch(r);return function(){l&&e.abort()}})}});g.operators=af;g.testing=cf;g.ajax=df;g.webSocket=ff;g.fetch=gf;g.Observable=r;g.ConnectableObservable=Ra;g.observable=pa;g.animationFrames=function(b){return b?Mb(b):Te};g.Subject=A;g.BehaviorSubject=Zc;g.ReplaySubject=
ha;g.AsyncSubject=fb;g.asap=Rd;g.asapScheduler=Rd;g.async=ib;g.asyncScheduler=I;g.queue=Sd;g.queueScheduler=Sd;g.animationFrame=Td;g.animationFrameScheduler=Td;g.VirtualTimeScheduler=Ud;g.VirtualAction=Gb;g.Scheduler=Fb;g.Subscription=D;g.Subscriber=na;g.Notification=Pa;g.pipe=Xa;g.noop=C;g.identity=E;g.isObservable=function(b){return!!b&&(b instanceof r||t(b.lift)&&t(b.subscribe))};g.lastValueFrom=function(b,a){var c="object"===typeof a;return new Promise(function(d,e){var f=!1,g;b.subscribe({next:function(a){g=
a;f=!0},error:e,complete:function(){f?d(g):c?d(a.defaultValue):e(new aa)}})})};g.firstValueFrom=function(b,a){var c="object"===typeof a;return new Promise(function(d,e){var f=new ia({next:function(a){d(a);f.unsubscribe()},error:e,complete:function(){c?d(a.defaultValue):e(new aa)}});b.subscribe(f)})};g.ArgumentOutOfRangeError=rb;g.EmptyError=aa;g.NotFoundError=ld;g.ObjectUnsubscribedError=Qd;g.SequenceError=kd;g.TimeoutError=Xb;g.UnsubscriptionError=Sa;g.bindCallback=function(b,a,c){return Ga(!1,b,
a,c)};g.bindNodeCallback=function(b,a,c){return Ga(!0,b,a,c)};g.combineLatest=$b;g.concat=ta;g.connectable=function(b,a){void 0===a&&(a=$e);var c=null,d=a.connector;a=a.resetOnDisconnect;var e=void 0===a?!0:a,f=d();a=new r(function(a){return f.subscribe(a)});a.connect=function(){if(!c||c.closed)c=Ia(function(){return b}).subscribe(f),e&&c.add(function(){return f=d()});return c};return a};g.defer=Ia;g.empty=function(b){return b?de(b):L};g.forkJoin=function(){for(var b=[],a=0;a<arguments.length;a++)b[a]=
arguments[a];var a=oa(b),b=Yb(b),c=b.args,d=b.keys,b=new r(function(a){var b=c.length;if(b)for(var e=Array(b),g=b,k=b,n=function(b){var f=!1;q(c[b]).subscribe(m(a,function(a){f||(f=!0,k--);e[b]=a},function(){return g--},void 0,function(){g&&f||(k||a.next(d?Zb(d,e):e),a.complete())}))},p=0;p<b;p++)n(p);else a.complete()});return a?b.pipe(W(a)):b};g.from=P;g.fromEvent=hb;g.fromEventPattern=dc;g.generate=function(b,a,c,d,e){function f(){var b;return Ua(this,function(d){switch(d.label){case 0:b=k,d.label=
1;case 1:return a&&!a(b)?[3,4]:[4,l(b)];case 2:d.sent(),d.label=3;case 3:return b=c(b),[3,1];case 4:return[2]}})}var g,l,k;1===arguments.length?(k=b.initialState,a=b.condition,c=b.iterate,g=b.resultSelector,l=void 0===g?E:g,e=b.scheduler):(k=b,!d||Ea(d)?(l=E,e=d):l=d);return Ia(e?function(){return Tb(f(),e)}:f)};g.iif=function(b,a,c){return Ia(function(){return b()?a:c})};g.interval=ec;g.merge=function(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];var a=O(b),c="number"===typeof b[b.length-
1]?b.pop():Infinity;return b.length?1===b.length?q(b[0]):sa(c)(P(b,a)):L};g.never=function(){return Vd};g.of=cb;g.onErrorResumeNext=fc;g.pairs=function(b,a){return P(Object.entries(b),a)};g.partition=function(b,a,c){return[K(a,c)(q(b)),K(gc(a,c))(q(b))]};g.race=function(){for(var b=[],a=0;a<arguments.length;a++)b[a]=arguments[a];b=Z(b);return 1===b.length?q(b[0]):new r(hc(b))};g.range=function(b,a,c){null==a&&(a=b,b=0);if(0>=a)return L;var d=a+b;return new r(c?function(a){var e=b;return c.schedule(function(){e<
d?(a.next(e++),this.schedule()):a.complete()})}:function(a){for(var c=b;c<d&&!a.closed;)a.next(c++);a.complete()})};g.throwError=Wb;g.timer=Y;g.using=function(b,a){return new r(function(c){var d=b(),e=a(d);(e?q(e):L).subscribe(c);return function(){d&&d.unsubscribe()}})};g.zip=jb;g.scheduled=Vb;g.EMPTY=L;g.NEVER=Vd;g.config=S;g.audit=kb;g.auditTime=ic;g.buffer=jc;g.bufferCount=kc;g.bufferTime=lc;g.bufferToggle=mc;g.bufferWhen=nc;g.catchError=lb;g.combineAll=Ja;g.combineLatestAll=Ja;g.combineLatestWith=
qc;g.concatAll=Ha;g.concatMap=Ka;g.concatMapTo=rc;g.concatWith=tc;g.connect=La;g.count=uc;g.debounce=vc;g.debounceTime=wc;g.defaultIfEmpty=ua;g.delay=xc;g.delayWhen=Ma;g.dematerialize=yc;g.distinct=zc;g.distinctUntilChanged=qb;g.distinctUntilKeyChanged=Ac;g.elementAt=Bc;g.endWith=Cc;g.every=Dc;g.exhaust=Oa;g.exhaustAll=Oa;g.exhaustMap=Na;g.expand=Ec;g.filter=K;g.finalize=Fc;g.find=Gc;g.findIndex=Ic;g.first=Jc;g.groupBy=Kc;g.ignoreElements=ob;g.isEmpty=Lc;g.last=Mc;g.map=Q;g.mapTo=pb;g.materialize=
Nc;g.max=Oc;g.mergeAll=sa;g.flatMap=H;g.mergeMap=H;g.mergeMapTo=Pc;g.mergeScan=Qc;g.mergeWith=Sc;g.min=Tc;g.multicast=Qa;g.observeOn=qa;g.onErrorResumeNextWith=Uc;g.pairwise=Vc;g.pluck=Wc;g.publish=Xc;g.publishBehavior=Yc;g.publishLast=$c;g.publishReplay=ad;g.raceWith=tb;g.reduce=fa;g.repeat=bd;g.repeatWhen=cd;g.retry=dd;g.retryWhen=ed;g.refCount=Za;g.sample=ub;g.sampleTime=fd;g.scan=gd;g.sequenceEqual=hd;g.share=vb;g.shareReplay=id;g.single=jd;g.skip=md;g.skipLast=nd;g.skipUntil=od;g.skipWhile=pd;
g.startWith=qd;g.subscribeOn=ra;g.switchAll=rd;g.switchMap=ja;g.switchMapTo=sd;g.switchScan=td;g.take=ga;g.takeLast=sb;g.takeUntil=ud;g.takeWhile=vd;g.tap=wd;g.throttle=xb;g.throttleTime=xd;g.throwIfEmpty=va;g.timeInterval=yd;g.timeout=eb;g.timeoutWith=zd;g.timestamp=Ad;g.toArray=mb;g.window=Bd;g.windowCount=Cd;g.windowTime=Dd;g.windowToggle=Ed;g.windowWhen=Fd;g.withLatestFrom=Gd;g.zipAll=Hd;g.zipWith=Jd;Object.defineProperty(g,"__esModule",{value:!0})});
//# sourceMappingURL=rxjs.umd.min.js.map


}
lib/rxjs.min.js
{
mp.events.addRequestResponse("storage:get", async (key) => {
    mp.storage.data = mp.storage.data || {};
    return mp.storage.data[key];
});
mp.events.addRequestResponse("storage:set", async (key, value) => {
    mp.storage.data = mp.storage.data || {};
    mp.storage.data[key] = value;
});
mp.events.addRequestResponse("storage:delete", async (key) => {
    mp.storage.data = mp.storage.data || {};
    delete mp.storage.data[key];
});
let currentAccountId = null;
let currentAccountName = null;
function getAccountKey(key) {
    return `${currentAccountId}\$\$\$${key}`;
}
mp.rpc("account:login", (accountId, accountName) => {
    currentAccountId = accountId;
    currentAccountName = accountName;
});
mp.events.addRequestResponse("storage:account:get", async (key) => {
    mp.storage.data = mp.storage.data || {};
    return mp.storage.data[getAccountKey(key)];
});
mp.events.addRequestResponse("storage:account:set", async (key, value) => {
    mp.storage.data = mp.storage.data || {};
    mp.storage.data[getAccountKey(key)] = value;
});
mp.events.addRequestResponse("storage:account:delete", async (key) => {
    mp.storage.data = mp.storage.data || {};
    delete mp.storage.data[getAccountKey(key)];
});

}
storage.js
{
System.register([], function (exports_1, context_1) {
    "use strict";
    var analyticsServerName, userEmail, userUserName;
    var __moduleName = context_1 && context_1.id;
    function trackBrowserEvent(name, params = {}) {
        const nameStr = JSON.stringify(name);
        const paramsStr = JSON.stringify({ position: mp.players.local.position, ...params });
        mp.browserExecute(`trackBrowserEvent(${nameStr}, ${paramsStr})`);
    }
    exports_1("trackBrowserEvent", trackBrowserEvent);
    function updateUserPosition() {
        const localPlayer = mp.players.local;
        const pos = localPlayer.position;
        const posStr = JSON.stringify({ x: pos.x, y: pos.y, z: pos.z });
        mp.browserExecute(`updateUserPosition(${posStr})`);
    }
    exports_1("updateUserPosition", updateUserPosition);
    function setUserLogin(info) {
        if (info.email && String(info.email).length > 0)
            userEmail = info.email;
        if (info.userName && String(info.userName).length > 0)
            userUserName = info.userName;
        if (info.serverName && String(info.serverName).length > 0)
            analyticsServerName = info.serverName;
        const emailStr = JSON.stringify(userEmail);
        const userNameStr = JSON.stringify(userUserName);
        const serverNameStr = JSON.stringify(analyticsServerName);
        mp.browserExecute(`setUserLogin(${emailStr}, ${userNameStr}, ${serverNameStr})`);
    }
    exports_1("setUserLogin", setUserLogin);
    function setTrackingInfo(info) {
        const infoStr = JSON.stringify(info);
        mp.browserExecute(`setTrackingInfo(${infoStr})`);
    }
    exports_1("setTrackingInfo", setTrackingInfo);
    return {
        setters: [],
        execute: function () {
            analyticsServerName = 'unknown-server';
            userEmail = 'unknown';
            userUserName = 'unknown';
            mp.rpc("analytics:trackBrowserEvent", (name, paramsJson) => {
                trackBrowserEvent(name, (paramsJson && paramsJson.length > 0) ? JSON.parse(paramsJson) : {});
            });
            mp.rpc("analytics:setUserLogin", (email, userName) => {
                setUserLogin({ email, userName });
            });
            mp.rpc("analytics:configure", (sendAll, filterWhiteListJson, filterBlackListJson) => {
                mp.browserExecute(`setAnalyticsConfig(${sendAll}, ${filterWhiteListJson}, ${filterBlackListJson})`);
            });
            mp.rpc("analytics:setTrackingInfo", (infoJson) => {
                setTrackingInfo(JSON.parse(infoJson));
            });
            mp.rpc("discord:set_server_name", (name) => {
                analyticsServerName = name;
            });
            mp.rpc("session:start", () => {
                mp.browserExecute(`trackingSessionStart()`);
            });
            mp.rpc("analytics:setConnectionId", (connection_uuid) => {
                mp.browserExecute(`trackingSetConnectionId(${JSON.stringify('' + connection_uuid)})`);
            });
            mp.rpc("analytics:setDistinctId", (distinct_id) => {
                mp.browserExecute(`trackingSetDistinctId(${JSON.stringify('' + distinct_id)})`);
            });
            // updateUserPosition()
            // mp.setInterval(updateUserPosition, 1000)
        }
    };
});

}
analytics.js
{
let lastStreamedPlayers = [];
let lastStreamedVehicles = [];
function intArrayEquals(array1, array2) {
    if (array1.length !== array2.length)
        return false;
    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i])
            return false;
    }
    return true;
}
mp.setInterval(() => {
    let streamedVehicles = mp.vehicles.streamed.map(e => e.remoteId);
    if (!intArrayEquals(streamedVehicles, lastStreamedVehicles)) {
        mp.events.originalCallRemote("notifyStreamedVehicles", JSON.stringify(streamedVehicles));
        lastStreamedVehicles = streamedVehicles;
    }
    let streamedPlayers = mp.players.streamed.map(e => e.remoteId);
    if (!intArrayEquals(streamedPlayers, lastStreamedPlayers)) {
        mp.events.originalCallRemote("notifyStreamedPlayers", JSON.stringify(streamedPlayers));
        lastStreamedPlayers = streamedPlayers;
    }
}, 30);

}
streaming_notify.js
{
// Implements calls that go directly to RAGE.
let lastVelocity = new mp.Vector3(0, 0, 0);
let lastPosition = new mp.Vector3(0, 0, 0);
//let lastHeading = new mp.Vector3(0, 0, 0); // Incorrect, this is a number
let lastHeading = 0;
let lastSentUpdateRageExtensions = 0;
const maxRetries = 5;
const minDelay = 1000;
const maxDelay = 5000;
const maxFailures = 6; // Maximum number of failures before declaring browser irrecoverable
const loadTimeout = 12000; // 12 seconds timeout for browser loading
const maxResourceFailures = 3; // Maximum number of resource failures before considering browser failed
// Returns a Promise<Browser> that resolves when the browser is ready or rejects after maxRetries
mp.browsers.retryNew = async (url, tries = 0, maxTries = maxRetries) => {
    return new Promise((resolve, reject) => {
        let browser = mp.browsers.new(url);
        browser.failing = false;
        browser.resourceFailures = 0;
        let hasLoaded = false;
        let isDestroyed = false;
        let timeoutId = null;
        const retryWithDelay = () => {
            if (hasLoaded || isDestroyed)
                return;
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            browser.destroy();
            isDestroyed = true;
            if (tries < maxTries) {
                const maxFailDelay = Math.min(maxDelay, minDelay * (tries + 1));
                const delay = Math.floor(Math.random() * (maxFailDelay - minDelay + 1)) + minDelay;
                setTimeout(() => {
                    // mp.console.logInfo(`Retrying to load ${url} (attempt ${tries + 1}/${maxTries}) after ${delay}ms`)
                    resolve(mp.browsers.retryNew(url, tries + 1, maxTries));
                }, delay);
            }
            else {
                reject(new Error(`Failed to load ${url} after ${maxTries} attempts`));
            }
        };
        browser.onLoadingFailed = () => {
            browser.resourceFailures++;
            // mp.console.logInfo(`Resource failed to load (${browser.resourceFailures}/${maxResourceFailures}) for ${url}`)
            if (browser.resourceFailures >= maxResourceFailures) {
                // mp.console.logInfo(`Too many resource failures (${browser.resourceFailures}), retrying with new browser...`)
                browser.failing = true;
                retryWithDelay();
            }
        };
        browser.onDomReady = () => {
            if (isDestroyed)
                return;
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            hasLoaded = true;
            // mp.console.logInfo(`Browser loaded successfully: ${url}`)
            resolve(browser);
        };
        // Set timeout for loading
        timeoutId = setTimeout(() => {
            // mp.console.logInfo(`Browser load timeout after ${loadTimeout}ms for ${url}, retrying...`)
            retryWithDelay();
        }, loadTimeout);
    });
};
mp.events.add('browserLoadingFailed', (browser) => {
    if (!browser || browser.failing)
        return;
    if (browser.onLoadingFailed === undefined)
        return;
    browser.onLoadingFailed();
});
mp.events.add('browserDomReady', (browser) => {
    if (!browser || browser.failing || browser.onDomReady === undefined)
        return;
    browser.onDomReady();
});
mp.setInterval(() => {
    let now = new Date().getTime();
    // get variables
    let vel = mp.players.local.getSpeedVector(false);
    let pos = mp.players.local.position;
    let heading = mp.players.local.getHeading();
    let heightAboveGround = mp.players.local.getHeightAboveGround();
    let vehicle = mp.players.local.vehicle;
    let actualVehicleHeightAboveGround = vehicle != null ? vehicle.getHeightAboveGround() : 0.0;
    // compare to previous values
    let distToLastVel = mp.game.system.vdist(vel.x, vel.y, vel.z, lastVelocity.x, lastVelocity.y, lastVelocity.z);
    let distToLastPos = mp.game.system.vdist(pos.x, pos.y, pos.z, lastPosition.x, lastPosition.y, lastPosition.z);
    let distToLastHeading = Math.abs(heading - lastHeading);
    let anyVarChanged = distToLastVel > 0.1 || distToLastPos > 0.1 || distToLastHeading > 0.5;
    // send only when changes occur or some time passed
    if (anyVarChanged || (now - lastSentUpdateRageExtensions) > 700) {
        mp.events.callRemoteUnreliable("rageextension:update_vectors", pos, heading, vel, heightAboveGround, actualVehicleHeightAboveGround);
        lastSentUpdateRageExtensions = now;
        // update previous variables
        lastVelocity = vel;
        lastPosition = pos;
        lastHeading = heading;
    }
}, 200);
mp.events.addRequestResponse = (name, callback) => {
    mp.events.add(name, async (id, _args) => {
        const args = JSON.parse(_args);
        let res = null;
        let ok = true;
        try {
            res = await callback(...args);
        }
        catch (e) {
            res = e?.message || `${e}`;
            ok = false;
        }
        setTimeout(() => {
            mp.browserCallSafe("CEFToClientRequestResponse", "response", id, ok, res);
        }, 1);
    });
};

}
rageextension.js
{
/** Extend GTA Vehicles, support some more synced properties */
let vehicles_translations = {};
mp.rpc("player:set_server_language", (lang) => {
    vehicles_translations = mp.getTranslations(['removeBelt'], lang);
});
/** All vehicles with more/lower engine power */
const VEHICLES_ENGINES_MULTIPLIER = [
    {
        model: "dilettante",
        power: -30,
    },
    {
        model: "sheriff",
        power: 18
    },
    {
        model: "sheriff2",
        power: 25
    },
    {
        model: "police",
        power: 18
    },
    {
        model: "police3",
        power: 13
    },
    {
        model: "vstr",
        power: -3
    },
    {
        model: "police2",
        power: 10
    },
    {
        model: "burrito3",
        power: -15,
    },
    {
        model: "rumpo",
        power: -20
    },
    {
        model: "speedo",
        power: -20
    },
    {
        model: "scoutpd",
        power: 14
    },
    {
        model: "fbi",
        power: 14
    },
    {
        model: "fbi2",
        power: 20
    },
    {
        model: "police4",
        power: 18
    },
    {
        model: "gauntletpd",
        power: 10
    },
    {
        model: "policeb",
        power: 20
    },
    {
        model: "predator",
        power: 30
    },
    {
        model: "policeb2",
        power: 14
    },
    {
        model: "insurgent2",
        power: 15
    },
    {
        model: "riot",
        power: 13
    },
    {
        model: "granger2pd",
        power: 15
    }
];
// crash detection
let crashDetectPrevHP = 0;
let crashDetectPrevSpeed = 0.0;
let crashDetectPrevVehicle = null;
let crashDetectFadeEnds = 0;
let crashDetectFadeInTime = 30;
let crashDetectFadeOutTime = 2500;
let crashDetectFadeTimeMultiplier = 90.0;
// all vehicle flags
const Flags = {
    HoodOpened: 1,
    TrunkOpened: 2,
    EngineOn: 4,
    LightsOn: 8,
    Window1: 16,
    Window2: 32,
    Window3: 64,
    Window4: 128,
    IndicatorLightRight: 256,
    IndicatorLightLeft: 512,
    Door1: 1024,
    Door2: 2048,
    Door3: 4096,
    Door4: 8192,
    AlarmOn: 16384,
    InteriorLightsOn: 32768
};
let lastVehicle = -1;
let lastSeat = -3;
let lastEntering = 0;
let streamInSafe = [];
// console info
let lastAdviced = 0;
// Attachments
const attachmentKeysVehicles = {};
const objectsListVehicles = [];
mp.game.vehicle.setExperimentalHornSyncEnabled(false);
mp.rpc("vehicles:set_engine_health", (vehicleId, health) => {
    let v = mp.vehicles.atRemoteId(vehicleId);
    if (!v)
        return;
    v.serverEngineHealth = health;
    if (v.handle !== 0) {
        v.setEngineHealth(health);
    }
});
mp.rpc("vehicles:set_dirt_level", (vehicleId, dirt) => {
    let v = mp.vehicles.atRemoteId(vehicleId);
    if (!v)
        return;
    v.dirtLevel = dirt;
    if (mp.vehicles.exists(v) && v.handle) {
        v.setDirtLevel(dirt);
    }
});
mp.rpc("vehicles:set_fixed", (vehicleId) => {
    let v = mp.vehicles.atRemoteId(vehicleId);
    if (!v)
        return;
    v.setFixed();
    let actualController = v.controller?.name || "none";
    if (actualController == mp.players.local.name) {
        mp.console.logInfo("actual vehicle controller: (you) " + actualController + " - repair");
    }
    else {
        mp.console.logInfo("actual vehicle controller: " + actualController + " - skip");
    }
});
mp.rpc("vehicles:update_body_damage", (vehicleId, vehicleDamage) => {
    let v = mp.vehicles.atRemoteId(vehicleId);
    if (!v)
        return;
    // don't re-stream if the vehicle was just un-streamed (actual rage bug)
    let timeSinceLastBodyDamage = Date.now() - (v.lastUpdateBodyDamage || 0);
    v.lastUpdateBodyDamage = Date.now();
    let actualDamage = mp.getVehicleDamage(v);
    let newDamage = JSON.parse(vehicleDamage);
    let engineHealth = v.getEngineHealth();
    if (mp.vehicleDamageNeedsFix(newDamage, actualDamage)) {
        v.setFixed();
        v.setEngineHealth(engineHealth);
    }
    mp.applyVehicleDamage(v, newDamage);
    v.serverBodyDamage = newDamage;
});
mp.rpc("vehicles:detach_trailer", (vehicleId) => {
    let v = mp.vehicles.atRemoteId(vehicleId);
    if (!v || !v.handle)
        return;
    v.detachFromTrailer();
});
mp.rpc("vehicles:set_controllable", (vehicleId, controllable) => {
    let v = mp.vehicles.atRemoteId(vehicleId);
    if (!v || !v.handle)
        return;
    v.freezePosition(!controllable);
});
mp.rpc("vehicles:set_sync_data", (vehicleId, flags) => {
    let v = mp.vehicles.atRemoteId(vehicleId);
    if (!v)
        return;
    flags = flags >>> 0;
    let oldFlags = v.flags >>> 0 || 0;
    v.flags = flags;
    v.oldFlags = oldFlags;
    if (v.handle !== 0) {
        setVehicleFlags(v);
    }
});
mp.events.addDataHandler("xenonLight", (entity, value, oldValue) => {
    if (mp.vehicles.exists(entity) && entity.handle && value !== oldValue) {
        // SetVehicleXenonLightsColor
        // void _SET_VEHICLE_XENON_LIGHTS_COLOR(Vehicle vehicle, int color);
        mp.game.invoke("0xE41033B25D003A07", entity.handle, value);
    }
});
function areVehiclesClipping(v1, v2, precise = false) {
    if (!precise) {
        let pos1 = v1.position;
        let pos2 = v2.position;
        return mp.game.system.vdist2(pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z) < 20.0 || v1.isTouching(v2.handle);
    }
    else {
        return v1.isTouching(v2.handle);
    }
}
mp.events.add({
    "entityStreamIn": (_entity) => {
        if (_entity.type === 'vehicle' && _entity.handle) {
            const entity = _entity;
            entity.setDirtLevel(entity.dirtLevel ? entity.dirtLevel : 0);
            entity.syncAttachments = true;
            setTimeout(() => setVehicleFlags(entity, true), 2000);
            // sync xenon lights
            if (typeof entity.getVariable('xenonLight') === "number") {
                mp.game.invoke("0xE41033B25D003A07", entity.handle, entity.getVariable('xenonLight'));
            }
            // try to avoid helicopters exploding
            if (entity.getClass() === 15 && entity.isSeatFree(-1) && entity.getNumberOfPassengers() === 0) {
                let pos = entity.getCoords(true);
                mp.game.streaming.requestCollisionAtCoord(pos.x, pos.y, pos.z);
                setTimeout(() => {
                    if (entity && mp.vehicles.exists(entity) && entity.handle) {
                        entity.setOnGroundProperly();
                    }
                }, 2000);
            }
            // sync vehicle damage
            //if (entity.setBodyDamage) {
            //    setVehicleDamage(entity); // !!! this function doesn't exist!! setBodyDamage either!!
            //    delete entity.setBodyDamage;
            //}
            // set proofs for motorcycles
            if (entity.getClass() === 8) {
                entity.setProofs(true, true, true, true, true, true, true, false);
            }
            entity.isWindowUp = function (window) { return !checkFlag(entity.flags, Flags[`Window${window}`]); };
        }
    }
});
mp.events.add("entityStreamOut", entity => {
    if (entity.type === 'vehicle' && entity.handle) {
        entity.syncAttachments = false;
    }
});
/** Disable horn when using boats */
mp.events.add("render", () => {
    let v = mp.players.local.vehicle;
    if (v) {
        /*
        if (mp.game.vehicle.isThisModelABoat(v.model)) {
            mp.game.controls.disableControlAction(0, 86, true); // INPUT_VEH_HORN
        }*/
        // auto-shutdown many times the engine while being in the car because
        // gta starts the engine again sometimes (when you're going on speed mostly)
        if (!checkFlag(v.flags, Flags.EngineOn)) {
            if (Date.now() - lastAdviced > 10000) {
                mp.console.logInfo(`current vehicle ID ${mp.players.local.vehicle.remoteId} shutdown automatically. Flags: ${v.flags} and checkFlags: ${checkFlag(v.flags, Flags.EngineOn)}`);
                lastAdviced = Date.now();
            }
            v.setEngineOn(false, false, true);
        }
        mp.game.controls.disableControlAction(27, 85, true); // disable radio menu (key Q)
        // cant leave vehicle if player has seatbelt
        if (mp.players.local.seatbelt) {
            mp.game.controls.disableControlAction(0, 75, true);
            mp.game.controls.disableControlAction(27, 75, true);
            if (mp.game.controls.isDisabledControlJustPressed(0, 75) || mp.game.controls.isDisabledControlJustPressed(27, 75)) {
                if (mp.gui.cursor.visible || mp.isTypingOnPhone())
                    return;
                mp.events.call("hud:short_info", `${vehicles_translations['removeBelt']}`, 3500);
            }
        }
        if (v.getClass() == 16 && checkFlag(v.flags, Flags.EngineOn)) {
            v.setEngineOn(true, true, true);
        }
    }
    mp.vehicles.forEachInStreamRange(vehicle => {
        if (checkFlag(vehicle.flags, Flags.AlarmOn) && !vehicle.isAlarmActivated()) {
            vehicle.setAlarm(true);
            vehicle.startAlarm();
        }
    });
});
mp.events.add('playerEnterVehicle', (vehicle, seat) => {
    if (seat === -1) {
        for (let veh in VEHICLES_ENGINES_MULTIPLIER) {
            if (mp.game.joaat(VEHICLES_ENGINES_MULTIPLIER[veh].model) === vehicle.model) {
                mp.players.local.vehicle.setEnginePowerMultiplier(VEHICLES_ENGINES_MULTIPLIER[veh].power);
                break;
            }
        }
    }
});
mp.events.add('playerLeaveVehicle', (vehicle, seat) => {
    if (!mp.vehicles.exists(vehicle) || !vehicle.handle)
        return;
    if (seat === -1) {
        if (mp.game.vehicle.isThisModelABoat(vehicle.model) || mp.game.vehicle.isThisModelAHeli(vehicle.model) || mp.game.vehicle.isThisModelAPlane(vehicle.model)) {
            vehicle.freezePosition(true);
        }
        // keeps engine running when player leave vehicle (only if engine is on)
        if (checkFlag(vehicle.flags, Flags.EngineOn)) {
            vehicle.setEngineOn(true, true, true);
        }
    }
});
let cancelEnterVehicleTimer = null;
mp.useInput(mp.input.ENTER_VEHICLE_PASSENGER, true, () => {
    let localPlayer = mp.players.local;
    if (localPlayer.isDead() ||
        mp.gui.cursor.visible ||
        localPlayer.vehicle != null ||
        mp.isTypingOnPhone() ||
        !localPlayer.getIsTaskActive(6) // CTaskPlayerOnFoot. This filters when doing animations or weird states
    )
        return;
    let seatBones = [
        "door_pside_f", // right front
        "door_dside_r", // left back
        "door_pside_r" //  right back
    ];
    let minDistance = 100.0;
    let selectedSeat = -1;
    let selectedVehicle = null;
    let maxRange = 6 * 6;
    let pos = localPlayer.position;
    mp.vehicles.forEachInStreamRange(v => {
        let vPos = v.position;
        if (mp.game.system.vdist2(pos.x, pos.y, pos.z, vPos.x, vPos.y, vPos.z) < maxRange && // near enough
            v.getSpeed() < 5 && // require the vehicle to be stationary
            v.isAnySeatEmpty()) {
            // find the nearest seat
            for (let seatIdx = 0; seatIdx < seatBones.length; seatIdx++) {
                let seatBoneIndex = v.getBoneIndexByName(seatBones[seatIdx]);
                if (seatBoneIndex !== -1 && v.getPedInSeat(seatIdx) === 0) { // this vehicle contains such seat, and is empty
                    let seatPos = v.getWorldPositionOfBone(seatBoneIndex);
                    let distanceToSeat = mp.game.system.vdist(pos.x, pos.y, pos.z, seatPos.x, seatPos.y, seatPos.z);
                    if (distanceToSeat < minDistance) {
                        selectedSeat = seatIdx;
                        selectedVehicle = v;
                        minDistance = distanceToSeat;
                    }
                }
            }
        }
    });
    // check if we found one seat
    if (selectedSeat !== -1 && selectedVehicle != null) {
        localPlayer.taskEnterVehicle(selectedVehicle.handle, 6000, selectedSeat, 1, 1, 0);
        if (cancelEnterVehicleTimer != null)
            clearTimeout(cancelEnterVehicleTimer);
        cancelEnterVehicleTimer = setTimeout(function () {
            if (!localPlayer.vehicle)
                localPlayer.clearTasks();
            cancelEnterVehicleTimer = null;
        }, 5000);
    }
});
function getPedSeat(vehicle, ped) {
    for (let i = -1; i < 16; i++) {
        if (vehicle.getPedInSeat(i) === ped.handle) {
            return i;
        }
    }
    return 255;
}
function setVehicleFlags(v, streamIn = false) {
    if (v.handle !== 0) {
        let oldFlags = v.oldFlags;
        let flags = v.flags;
        // check for hood change
        if (checkFlag(oldFlags, Flags.HoodOpened) !== checkFlag(flags, Flags.HoodOpened) || streamIn) {
            if (checkFlag(flags, Flags.HoodOpened)) {
                v.setDoorOpen(4, false, false);
            }
            else {
                v.setDoorShut(4, false);
            }
        }
        // check for trunk change
        if (checkFlag(oldFlags, Flags.TrunkOpened) !== checkFlag(flags, Flags.TrunkOpened) || streamIn) {
            if (checkFlag(flags, Flags.TrunkOpened)) {
                v.setDoorOpen(5, false, false);
            }
            else {
                v.setDoorShut(5, false);
            }
        }
        // check alarm change
        if (checkFlag(oldFlags, Flags.AlarmOn) !== checkFlag(flags, Flags.AlarmOn) || streamIn) {
            if (checkFlag(flags, Flags.AlarmOn)) {
                v.setAlarm(true);
                v.startAlarm();
            }
            else {
                v.setAlarm(false);
            }
        }
        // check for engine change (turn on instantly if is streamIn)
        if ((oldFlags === flags && oldFlags === 0) || checkFlag(oldFlags, Flags.EngineOn) !== checkFlag(flags, Flags.EngineOn) || streamIn) {
            v.setEngineOn(checkFlag(flags, Flags.EngineOn), streamIn, true);
        }
        // check for lights change
        let oldLightsOn = checkFlag(oldFlags, Flags.LightsOn);
        let newLightsOn = checkFlag(flags, Flags.LightsOn);
        if (oldLightsOn !== newLightsOn || streamIn) {
            v.setLights(newLightsOn ? 2 : 1);
        }
        // check for interior lights change
        if (checkFlag(oldFlags, Flags.InteriorLightsOn) != checkFlag(flags, Flags.InteriorLightsOn) || streamIn) {
            v.setInteriorlight(checkFlag(flags, Flags.InteriorLightsOn));
        }
        // check for window change
        if (checkFlag(oldFlags, Flags.Window1) !== checkFlag(flags, Flags.Window1) || streamIn) {
            setWindowOpened(v, 0, checkFlag(flags, Flags.Window1));
        }
        if (checkFlag(oldFlags, Flags.Window2) !== checkFlag(flags, Flags.Window2) || streamIn) {
            setWindowOpened(v, 1, checkFlag(flags, Flags.Window2));
        }
        if (checkFlag(oldFlags, Flags.Window3) !== checkFlag(flags, Flags.Window3) || streamIn) {
            setWindowOpened(v, 2, checkFlag(flags, Flags.Window3));
        }
        if (checkFlag(oldFlags, Flags.Window4) !== checkFlag(flags, Flags.Window4) || streamIn) {
            setWindowOpened(v, 3, checkFlag(flags, Flags.Window4));
        }
        // check for indicator lights
        if (checkFlag(oldFlags, Flags.IndicatorLightRight) !== checkFlag(flags, Flags.IndicatorLightRight) || streamIn) {
            v.setIndicatorLights(0, checkFlag(flags, Flags.IndicatorLightRight));
        }
        if (checkFlag(oldFlags, Flags.IndicatorLightLeft) !== checkFlag(flags, Flags.IndicatorLightLeft) || streamIn) {
            v.setIndicatorLights(1, checkFlag(flags, Flags.IndicatorLightLeft));
        }
        // check for door change
        if (checkFlag(oldFlags, Flags.Door1) !== checkFlag(flags, Flags.Door1) || streamIn) {
            setDoorOpened(v, 0, checkFlag(flags, Flags.Door1));
        }
        if (checkFlag(oldFlags, Flags.Door2) !== checkFlag(flags, Flags.Door2) || streamIn) {
            setDoorOpened(v, 1, checkFlag(flags, Flags.Door2));
        }
        if (checkFlag(oldFlags, Flags.Door3) !== checkFlag(flags, Flags.Door3) || streamIn) {
            setDoorOpened(v, 2, checkFlag(flags, Flags.Door3));
        }
        if (checkFlag(oldFlags, Flags.Door4) !== checkFlag(flags, Flags.Door4) || streamIn) {
            setDoorOpened(v, 3, checkFlag(flags, Flags.Door4));
        }
    }
}
function setDoorOpened(vehicle, door, opened) {
    if (opened) {
        vehicle.setDoorOpen(door, false, false);
    }
    else {
        vehicle.setDoorShut(door, false);
    }
}
function setWindowOpened(vehicle, window, opened) {
    if (opened) {
        vehicle.rollDownWindow(window);
    }
    else {
        vehicle.rollUpWindow(window);
    }
}
function checkFlag(flags, value) {
    return (flags & value) ? true : false;
}
function onPlayerCrashVehicle(damageCaused) {
    mp.game.graphics.startScreenEffect("REDMISTOut", 1500, false);
    mp.events.call("camera:shake", "JOLT_SHAKE", damageCaused * 0.08);
    mp.events.callRemote("health:on_player_crash_vehicle", mp.players.local.vehicle.remoteId, damageCaused);
    if (damageCaused > 15) {
        if (crashDetectFadeEnds === 0) {
            mp.events.call("player:toggle_black_screen", true, crashDetectFadeInTime);
        }
        let totalTime = crashDetectFadeInTime + Math.round(damageCaused) * crashDetectFadeTimeMultiplier;
        crashDetectFadeEnds = Math.max(crashDetectFadeEnds, new Date().getTime() + totalTime);
        mp.game.graphics.transitionToBlurred(500);
        //mp.events.call("chat:push", "crashed with damage: " + damageCaused + " for time: " + totalTime);
    }
}
function syncAttachmentObjectsVehicles(vehicle, keys) {
    let oldObjects = vehicle.attachmentObjects || {};
    for (let key of Object.keys(oldObjects)) {
        const obj = oldObjects[key];
        if (!mp.objects.exists(obj))
            continue;
        obj.destroy();
        const index = objectsListVehicles.indexOf(obj);
        if (index > -1) {
            objectsListVehicles.splice(index, 1);
        }
    }
    vehicle.attachmentObjects = {};
    // mp.console.logInfo("syncAttachmentObjectsVehicles: " + keys);
    if (keys.length > 0) {
        const localPos = mp.players.local.position;
        // Hide the object underground before attaching it to the vehicle
        localPos.z -= 15;
        // mp.console.logInfo("0 attach to vehicle: " + vehicle.remoteId + " keys: " + keys);
        for (let key of keys) {
            let keyData = attachmentKeysVehicles[key];
            // mp.console.logInfo("0.5 attach to vehicle: " + vehicle.remoteId + " key: " + keyData);
            if (keyData == null)
                return;
            const obj = mp.objects.new(keyData.model, localPos, { dimension: -1 });
            if (!obj) {
                // mp.console.logWarning(`syncAttachments - can't create obj. (Vehicles)`);
                return;
            }
            obj.checkForStream = true;
            obj.shouldAttachToVehicle = vehicle;
            obj.shouldAttachKeyData = keyData;
            obj.oldHandle = 0;
            vehicle.attachmentObjects[key] = obj;
            objectsListVehicles.push(obj);
        }
    }
}
function checkDistanceForAttachmentsVehicles(vehicle) {
    let localPos = mp.players.local.position;
    let vehiclePos = vehicle.position;
    let distance = mp.game.system.vdist2(localPos.x, localPos.y, localPos.z, vehiclePos.x, vehiclePos.y, vehiclePos.z);
    if (distance <= 50 && vehicle.syncAttachments) {
        vehicle.syncAttachments = false;
        let keys = vehicle.attachmentKeys;
        if (keys) {
            syncAttachmentObjectsVehicles(vehicle, keys);
        }
    }
    else if (distance > 50 && !vehicle.syncAttachments) {
        vehicle.syncAttachments = true;
        if (vehicle.attachmentObjects) {
            syncAttachmentObjectsVehicles(vehicle, []);
        }
    }
}
mp.events.add("objectHandleChange", (entity) => {
    if (!entity.handle || entity.type !== "object" || !entity.shouldAttachToVehicle)
        return;
    const vehicle = entity.shouldAttachToVehicle;
    const keyData = entity.shouldAttachKeyData;
    // mp.console.logInfo("2 attach to vehicle: " + vehicle.remoteId + " key: " + keyData);
    if (!mp.vehicles.exists(vehicle) || !vehicle.handle || !keyData)
        return;
    // mp.console.logInfo("3 attach to vehicle: " + vehicle.remoteId + " key: " + keyData);
    entity.attachTo(vehicle.handle, 0, keyData.offset.x, keyData.offset.y, keyData.offset.z, keyData.rotation.x, keyData.rotation.y, keyData.rotation.z, false, false, false, false, 2, true);
});
mp.rpc("vehicles:register_attachment", (key, model, offset, rotation) => {
    attachmentKeysVehicles[key] = {
        model: model,
        offset: offset,
        rotation: rotation
    };
    // mp.console.logInfo(JSON.stringify(attachmentKeysVehicles));
});
mp.rpc("vehicles:set_attachments", (id, list) => {
    const vehicle = mp.vehicles.atRemoteId(id);
    if (!vehicle)
        return;
    const keys = JSON.parse(list);
    vehicle.attachmentKeys = keys;
    // mp.console.logInfo("set_attachments: " + keys);
    if (vehicle.handle) {
        vehicle.syncAttachments = true;
        checkDistanceForAttachmentsVehicles(vehicle);
    }
});
mp.setInterval(() => {
    for (let [index, obj] of objectsListVehicles.entries()) {
        if (mp.objects.exists(obj)) {
            if (obj.checkForStream) {
                let oldHandle = obj.oldHandle;
                let handle = obj.handle;
                if (oldHandle !== handle) {
                    mp.events.call("objectHandleChange", obj);
                    obj.oldHandle = handle;
                }
            }
        }
    }
}, 50);
// Prevent boats from moving while on sea
// (when they don't have drivers in) and keep
// the sea calm, for easier sync.
mp.setInterval(() => {
    let now = new Date().getTime();
    let playerPos = mp.players.local.position;
    mp.vehicles.forEachInStreamRange((v) => {
        if (!mp.vehicles.exists(v) || !v.handle)
            return;
        // freeze unoccupied boats to ease sync
        if (mp.game.vehicle.isThisModelABoat(v.model)) {
            setTimeout(() => {
                if (mp.vehicles.exists(v))
                    v.freezePosition(v.isSeatFree(-1) ? true : false);
            }, 2000);
        }
        // set entity collision to prevent the helicopter/plane from exploding and freeze if not has pilot
        else if (mp.game.vehicle.isThisModelAHeli(v.model) || mp.game.vehicle.isThisModelAPlane(v.model)) {
            v.setLoadCollisionFlag(true);
            setTimeout(() => {
                if (mp.vehicles.exists(v))
                    v.freezePosition(v.isSeatFree(-1) ? true : false);
            }, 2000);
        }
        // It will crash client-side if you try to getPedInSeat for a trailer model vehicle (https://wiki.rage.mp/index.php?title=Vehicle::getPedInSeat)
        if (v.getClass() === 11) {
            v.setProofs(false /*bullet*/, false /*fire*/, false /*explosion*/, false /*collision*/, true /*melee*/, true, true, false /*drown*/);
            return;
        }
        if (v.getPedInSeat(-1) === 0) {
            // proof to almost everything except collisions while not occupied.
            v.setProofs(true, true, true, true, true, true, true, false);
        }
        else {
            v.setProofs(false, true, true, false, true, true, true, false);
        }
        // detect dead vehicles: if staying in water for longer than 10 seconds (and near it)
        let vehiclePosition = v.position;
        let near = mp.game.system.vdist2(vehiclePosition.x, vehiclePosition.y, vehiclePosition.z, playerPos.x, playerPos.y, playerPos.z) < 100 * 100;
        v.enterWaterTime ?? (v.enterWaterTime = 0);
        v.hasBeenReportedDead ?? (v.hasBeenReportedDead = false);
        if (v.handle &&
            near &&
            //(v.isDead() === 1 || (v.isInWater() && v.getSubmergedLevel() > 0.9)) && // @TODO: boolean === 1 might not work if we have a boolean
            (v.isDead() || (v.isInWater() && v.getSubmergedLevel() > 0.9)) &&
            v.getClass() !== 14) {
            if (v.enterWaterTime === 0) {
                v.enterWaterTime = now;
            }
            else if ((now - v.enterWaterTime) > 7500 && !v.hasBeenReportedDead) {
                v.enterWaterTime = 0;
                v.hasBeenReportedDead = true;
                mp.events.callRemote("vehicles:on_death", v.remoteId);
            }
        }
        else {
            v.enterWaterTime = 0;
            v.hasBeenReportedDead = false;
        }
        // Attachments
        checkDistanceForAttachmentsVehicles(v);
    });
}, 2000);
mp.setInterval(() => {
    let v = mp.players.local.vehicle;
    if (v !== crashDetectPrevVehicle) {
        crashDetectPrevVehicle = v;
        if (v) {
            crashDetectPrevHP = v.getBodyHealth();
        }
    }
    let time = new Date().getTime();
    if (crashDetectFadeEnds !== 0) {
        mp.game.controls.disableAllControlActions(0); // INPUTGROUP_MOVE
        mp.game.controls.disableAllControlActions(27); // INPUTGROUP_VEH_MOVE_ALL
        mp.game.controls.disableAllControlActions(31); // INPUTGROUP_VEH_HYDRAULICS_CONTROL
        // enable voice, as it's disabled with all those controls
        mp.game.controls.enableControlAction(0, 249, true);
        if (time > crashDetectFadeEnds) {
            crashDetectFadeEnds = 0;
            mp.events.call("player:toggle_black_screen", false, crashDetectFadeOutTime);
            mp.game.graphics.startScreenEffect('ArenaEMPOut', 7500, false);
            mp.game.graphics.transitionFromBlurred(7500);
        }
    }
    if (!v)
        return;
    let hp = v.getBodyHealth();
    let speed = Math.round(v.getSpeed() * 3.6);
    if (hp < crashDetectPrevHP && Math.abs(crashDetectPrevSpeed - speed) > 2.0) {
        onPlayerCrashVehicle(crashDetectPrevHP - hp);
    }
    crashDetectPrevHP = hp;
    crashDetectPrevSpeed = speed;
}, 20);
// set radio off
mp.setInterval(() => {
    if (mp.players.local.vehicle) {
        mp.game.audio.setRadioToStationName("OFF");
    }
}, 150);
// keep sea level low to ease sync
mp.game.water.setWavesIntensity(0.0);
mp.setInterval(() => {
    mp.game.water.setWavesIntensity(0.0);
}, 5000);
// Body health sync loop. Send every 1 sec the vehicle body health
mp.setInterval(() => {
    let v = mp.players.local.vehicle;
    if (v && v.getPedInSeat(-1) === mp.players.local.handle) {
        const lastUpdateBodyDamage = v.lastUpdateBodyDamage || 0;
        if (Date.now() - lastUpdateBodyDamage > 1000) {
            const vehDamage = mp.getVehicleDamage(v);
            if (JSON.stringify(v.serverBodyDamage) !== JSON.stringify(vehDamage)) {
                v.serverBodyDamage = vehDamage;
                mp.events.callRemote("vehicles:on_body_damage_change", v.remoteId, JSON.stringify(vehDamage));
            }
        }
        const newDirt = v.getDirtLevel() || 0;
        if (Math.abs(newDirt - v.dirtLevel) > 0.5) {
            mp.events.callRemote("vehicles:on_dirt_level_change", v.remoteId, newDirt);
        }
    }
}, 1000);
// dispatch entering vehicle events
mp.setInterval(() => {
    let p = mp.players.local;
    let entering = p.getVehicleIsTryingToEnter();
    if (entering !== 0 && entering !== lastEntering) {
        let seat = p.getSeatIsTryingToEnter();
        let v = mp.vehicles.atHandle(entering);
        if (v) {
            mp.events.callRemote("vehicles:on_try_enter", v.remoteId, seat + 1);
        }
    }
    lastEntering = entering;
    if (p.vehicle) {
        // changed vehicle, now must find seat.
        let mySeat = getPedSeat(p.vehicle, p);
        if (mySeat !== 255) {
            if (lastVehicle !== p.vehicle.id || lastSeat !== mySeat) {
                mp.events.callRemote("vehicles:on_change", p.vehicle.remoteId, mySeat + 1);
                lastVehicle = p.vehicle.id;
                lastSeat = mySeat;
                // forcefully "start" engine of bikes, as bikes are 'always' on
                if (mp.game.vehicle.isThisModelABicycle(p.vehicle.model)) {
                    p.vehicle.setEngineOn(true, false, true);
                }
            }
        }
    }
    else {
        if (lastVehicle !== -1) {
            lastVehicle = -1;
            mp.events.callRemote("vehicles:on_change", -1, -1);
            lastSeat = 255;
        }
    }
}, 50);

}
vehicles.js
{
/**
 * Abstraction to work with many UIs that use cursor or disable chat at the same time.
 */
let uis = [];
let lastUIHide = 0; // trick to not detect click as soon as the UI mode is closed
let browser = null; // browser that contains all UIs
let hudHidden = false;
let radarToggled = false;
let mouseOverUi = false;
let playerLabelsHidden = false;
/** Wrapper to trigger call remote but with a few checks and support for sounds */
mp.events.add("ui:wrapped_trigger", (topUI, sound, event, ...args) => {
    if (topUI != "" && topUI != mp.getTopUI()) {
        return;
    }
    if (sound == "ok") {
        mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    }
    else if (sound == "cancel") {
        mp.game.audio.playSoundFrontend(2, "BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    }
    mp.events.callRemote(event, ...args);
});
/** Wrapper to create listeners from CEF */
mp.events.add("ui:wrapped_rpc", (event, browserObject, browserSymbol) => {
    mp.rpc(event, (...args) => {
        mp.browserCall(browserObject, browserSymbol, ...args);
    });
});
/** Wrapper to trigger sounds from CEF */
mp.events.add("ui:sound", (sound) => {
    if (sound == "ok") {
        mp.game.audio.playSoundFrontend(2, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    }
    else if (sound == "cancel") {
        mp.game.audio.playSoundFrontend(2, "BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    }
    else if (sound == "navigate") {
        mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    }
    else if (sound == "swap") {
        mp.game.audio.playSoundFrontend(2, "Pin_Centred", "DLC_HEIST_BIOLAB_PREP_HACKING_SOUNDS", true);
    }
});
mp.events.add("sound:cancel", () => {
    mp.game.audio.playSoundFrontend(2, "BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
});
/** Returns true if there's any UI active. */
mp.isAnyUIEnabled = function () {
    return uis.length !== 0;
};
let waitingForBrowser = false;
const codeWaiting = [];
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/** Execute raw browser core. Prefer mp.browserSet and mp.browserCall. */
mp.browserExecute = async function (code) {
    const rcode = `try { ${code} ; } catch (__exception) { console.error('Error executing JS...', __exception, 'code', ${JSON.stringify(code)}); }`;
    //mp.console.logInfo(`Browser: Executing... ${code}`, true, true);
    codeWaiting.push(rcode);
    if (browser != null) {
        try {
            while (codeWaiting.length)
                browser.execute(codeWaiting.shift());
        }
        catch (error) {
            mp.console.logError(`Browser: Failed to execute javascript: code=${code}, error=${error}`, true, true);
        }
        return;
    }
    if (waitingForBrowser) {
        return;
    }
    waitingForBrowser = true;
    try {
        const loadedBrowser = await mp.browsers.retryNew("package://html/index.html");
        loadedBrowser.active = true;
        await delay(100);
        browser = loadedBrowser;
        while (codeWaiting.length)
            browser.execute(codeWaiting.shift());
    }
    catch (error) {
        mp.console.logError(error, true, true);
        mp.console.logError("Browser: Failed to load browser, please restart the game.", true, true);
    }
    finally {
        mp.console.logInfo("Browser: Browser loaded, success? " + (browser != null ? "yes" : "no") + ".", true, true);
        waitingForBrowser = false;
    }
};
/** Set the given variable on the browser. */
mp.browserSet = function (vm, variable, value) {
    let code = vm + "." + variable + "=" + JSON.stringify(value);
    mp.browserExecute(code);
};
mp.browserSetSafe = function (vm, variable, value) {
    let code = "window?." + vm + "?." + variable + "=" + JSON.stringify(value);
    mp.browserExecute(code);
};
const _browserCall = function (op, vm, func, ...args) {
    let code = vm + op + func + "(" + args.map(a => JSON.stringify(a)).join(",") + ")";
    mp.browserExecute(code);
};
/** Call the given function on the browser. */
mp.browserCall = function (vm, func, ...args) {
    _browserCall(".", vm, func, ...args);
};
mp.browserCallSafe = function (vm, func, ...args) {
    _browserCall("?.", vm, func, ...args);
};
/**
 * Used to show or hide the radar, keeping in mind that
 * HUD can be toggled on/off.
 */
mp.toggleRadar = function (toggle) {
    radarToggled = toggle;
    if (mp.isHudToggled()) { // update the change visually if the hud is on
        mp.game.ui.displayRadar(toggle);
        mp.browserSet("hudVM", "show", toggle);
        mp.events.call("ui:on_toggle_radar", toggle);
    }
};
/** Returns true if the radar is visible, false otherwise */
mp.isRadarToggled = function () {
    return radarToggled;
};
mp.getLastUIHide = function () { return lastUIHide; };
mp.toggleHud = function (toggle) {
    if (browser) {
        if (uiStatus === 2 && toggle)
            return; // iu status 2 == player disabled, only can show again if player enable it with key
        browser.active = toggle;
        // update radar
        let shouldToggleRadar = toggle && radarToggled;
        mp.game.ui.displayRadar(shouldToggleRadar);
        mp.events.call("ui:on_toggle_radar", shouldToggleRadar);
        // ui status 1 == player disable labels
        if (toggle && uiStatus !== 1 || !toggle) {
            mp.toggleHeadPlayerLabels(toggle);
        }
    }
};
mp.isHudToggled = function () {
    if (!browser) {
        return false;
    }
    return browser.active;
};
// hide/show hud with F7
let uiStatus = 0;
mp.useInput(mp.input.TOGGLE_HUD, true, () => {
    if (uiStatus === 2)
        uiStatus = 0;
    else
        uiStatus++;
    switch (uiStatus) {
        case 0:
            mp.toggleHud(!mp.isHudToggled());
            break;
        case 1:
            mp.toggleHeadPlayerLabels(false);
            break;
        case 2: mp.toggleHud(!mp.isHudToggled());
    }
});
mp.events.add("ui:enable_ui", (ui, disableChat, disableRadar, enableCursor, blurBackground) => {
    mp.enableUI(ui, disableChat, disableRadar, enableCursor, blurBackground);
});
/** Enable UI mode for the given view, putting the UI at the top. */
mp.enableUI = function (ui, disableChat, disableRadar, enableCursor, blurBackground = false) {
    for (let i = 0; i < uis.length; i++) { // ignore if it's duplicate
        if (uis[i].ui === ui)
            return;
    }
    if (enableCursor)
        mp.gui.cursor.visible = true;
    if (disableChat)
        mp.events.call("chat:show", false);
    if (disableRadar)
        mp.toggleRadar(false);
    if (blurBackground) {
        // apply effect and sound only if we are the first view with blurBackground
        let anyBlurBackground = false;
        for (const subUI of uis) {
            if (subUI.blurBackground) {
                anyBlurBackground = true;
                break;
            }
        }
        if (!anyBlurBackground) {
            mp.game.graphics.startScreenEffect("MenuMGIn", 0, false);
            mp.game.audio.playSoundFrontend(2, "FocusIn", "HintCamSounds", true);
        }
    }
    uis.push({
        ui: ui,
        disableChat: disableChat,
        disableRadar: disableRadar,
        enableCursor: enableCursor,
        blurBackground: blurBackground,
    });
    mp.browserCall("mp", "onUIEnabled", ui);
};
/** Returns true if the given UI is enabled. */
mp.isUIEnabled = function (ui) {
    for (let i = 0; i < uis.length; i++) {
        if (uis[i].ui === ui)
            return true;
    }
    return false;
};
/** Toggle head player labels */
mp.toggleHeadPlayerLabels = function (toggle) {
    playerLabelsHidden = !toggle;
};
/** Returns if the player head labels are enabled */
mp.isPlayerHeadLabelsEnabled = function () {
    return !playerLabelsHidden;
};
/** Returns the latest UI that entered UI mode, or null if isn't in UI mode. */
mp.getTopUI = function () {
    if (uis.length === 0)
        return null;
    return uis[uis.length - 1].ui;
};
mp.events.add("ui:disable_ui", (ui) => {
    mp.disableUI(ui);
});
/** Exit UI mode for the given UI. */
mp.disableUI = function (ui) {
    let idx = -1;
    for (let i = 0; i < uis.length; i++) {
        if (uis[i].ui == ui) {
            idx = i;
            break;
        }
    }
    if (idx === -1)
        return;
    let [removedIu] = uis.splice(idx, 1);
    let anyHidingRadar = false;
    let anyHidingChat = false;
    let anyEnablingCursor = false;
    let anyBlurBackground = false;
    for (let i = 0; i < uis.length; i++) {
        anyHidingChat = anyHidingChat || uis[i].disableChat;
        anyHidingRadar = anyHidingRadar || uis[i].disableRadar;
        anyEnablingCursor = anyEnablingCursor || uis[i].enableCursor;
        anyBlurBackground = anyBlurBackground || uis[i].blurBackground;
    }
    if (!anyEnablingCursor) {
        mp.gui.cursor.visible = false;
        lastUIHide = new Date().getTime();
    }
    if (!anyHidingChat)
        mp.events.call("chat:show", true);
    if (!anyHidingRadar)
        mp.toggleRadar(true);
    // check if we are the last UI
    if (!anyBlurBackground && removedIu.blurBackground) {
        mp.game.audio.playSoundFrontend(2, "FocusOut", "HintCamSounds", true);
        mp.game.graphics.stopScreenEffect("MenuMGIn");
        mp.game.graphics.startScreenEffect("PPPinkOut", 200, false);
    }
    mp.browserCall("mp", "onUIDisabled", ui);
};
mp.isMouseOverUi = function () {
    return mouseOverUi;
};
mp.events.add("ui:on_eval_result", (resultJSON) => {
    mp.console.logInfo(resultJSON);
});
mp.events.add("ui:on_eval_exception", (resultJSON) => {
    mp.console.logWarning(resultJSON);
});
// disable shot when player has UI
let lastCursor = 0;
let lastSent = 0;
let lastSentX = 0, lastSentY = 0;
mp.events.add("render", () => {
    if (!mp.gui.cursor.visible && Date.now() - lastCursor < 500) {
        mp.game.controls.disableControlAction(0, 24, true); // fire
    }
    if (mp.gui.cursor.visible) {
        lastCursor = Date.now();
        const currentX = mp.gui.cursor.position[0];
        const currentY = mp.gui.cursor.position[1];
        if (Date.now() - lastSent >= 33 && (currentX !== lastSentX || currentY !== lastSentY)) {
            mp.browserExecute(`
                document.dispatchEvent(
                    new CustomEvent(
                        'gamemousemove',
                        { bubbles: true, cancelable: true, detail: {
                            clientX: ${currentX}, clientY: ${currentY}
                        } }
                    )
                )
            `);
            lastSent = Date.now();
            lastSentX = currentX;
            lastSentY = currentY;
        }
    }
});
mp.events.add("ui:mouse_over", (toggle) => {
    mouseOverUi = toggle;
});

}
{
/// <reference path="../node_modules/@ragempcommunity/types-client/index.d.ts" />
let helicam_translations = {};
let fov_max = 80.0;
let fov_min = 10.0; // max zoom level (smaller fov is more zoom)
let zoomspeed = 2.0; // camera zoom speed
let speed_lr = 3.0; // speed by which the camera pans left-right
let speed_ud = 3.0; // speed by which the camera pans up-down
let toggle_vision = 34; // control id to toggle vision mode. Default: INPUT_MOVE_LEFT_ONLY (left arrow)
let toggle_lock_on = 22; // control id to lock onto a vehicle with the camera. Default is INPUT_SPRINT (spacebar)
let helicam = false;
let fov = (fov_max + fov_min) * 0.5;
let vision_state = 0; // 0 is normal, 1 is nightmode, 2 is thermal vision
var cam;
let locked_on_vehicle = null;
let scaleform;
let localPlayerHelicam = mp.players.local;
/* Helicopter light */
let isSpotlightEnabled = false;
let activeLights = [];
let lastSync = 0;
const ZONES = [
    { position: new mp.Vector3(-3950, -4000, 0), name: 'OCEANA' },
    { position: new mp.Vector3(-1250, -3550, 0), name: 'AIRP' },
    { position: new mp.Vector3(100, -3400, 0), name: 'ELYSIAN' },
    { position: new mp.Vector3(700, -3400, 0), name: 'TERMINA' },
    { position: new mp.Vector3(550, -2700, 0), name: 'CYPRE' },
    { position: new mp.Vector3(1050, -2700, 0), name: 'EBURO' },
    { position: new mp.Vector3(1800, -2700, 0), name: 'PALHIGH' },
    { position: new mp.Vector3(-250, -2350, 0), name: 'BANNING' },
    { position: new mp.Vector3(-250, -2150, 0), name: 'STAD' },
    { position: new mp.Vector3(-150, -2150, 0), name: 'ZP_ORT' },
    { position: new mp.Vector3(150, -2150, 0), name: 'RANCHO' },
    { position: new mp.Vector3(-750, -2100, 0), name: 'LOSPUER' },
    { position: new mp.Vector3(-100, -2000, 0), name: 'DAVIS' },
    { position: new mp.Vector3(-1150, -1950, 0), name: 'SanAnd' },
    { position: new mp.Vector3(1050, -1950, 0), name: 'MURRI' },
    { position: new mp.Vector3(-1150, -1800, 0), name: 'DELSOL' },
    { position: new mp.Vector3(-250, -1750, 0), name: 'CHAMH' },
    { position: new mp.Vector3(650, -1700, 0), name: 'LMESA' },
    { position: new mp.Vector3(-1350, -1650, 0), name: 'BEACH' },
    { position: new mp.Vector3(-50, -1650, 0), name: 'STRAW' },
    { position: new mp.Vector3(-1200, -1400, 0), name: 'VESP' },
    { position: new mp.Vector3(-1150, -1400, 0), name: 'VCANA' },
    { position: new mp.Vector3(-550, -1400, 0), name: 'KOREAT' },
    { position: new mp.Vector3(-1600, -1150, 0), name: 'DELBE' },
    { position: new mp.Vector3(-350, -1150, 0), name: 'PBOX' },
    { position: new mp.Vector3(200, -1150, 0), name: 'SKID' },
    { position: new mp.Vector3(150, -1000, 0), name: 'LEGSQU' },
    { position: new mp.Vector3(1400, -1000, 0), name: 'TATAMO' },
    { position: new mp.Vector3(-1350, -950, 0), name: 'DELPE' },
    { position: new mp.Vector3(300, -850, 0), name: 'TEXTI' },
    { position: new mp.Vector3(900, -800, 0), name: 'MIRR' },
    { position: new mp.Vector3(-400, -700, 0), name: 'DOWNT' },
    { position: new mp.Vector3(-1900, -650, 0), name: 'PBLUFF' },
    { position: new mp.Vector3(-1250, -600, 0), name: 'MOVIE' },
    { position: new mp.Vector3(-1000, -500, 0), name: 'ROCKF' },
    { position: new mp.Vector3(-200, -500, 0), name: 'VINE' },
    { position: new mp.Vector3(650, -500, 0), name: 'EAST_V' },
    { position: new mp.Vector3(-200, -450, 0), name: 'BURTON' },
    { position: new mp.Vector3(0, -450, 0), name: 'ALTA' },
    { position: new mp.Vector3(2500, -450, 0), name: 'NOOSE' },
    { position: new mp.Vector3(-1550, -400, 0), name: 'MORN' },
    { position: new mp.Vector3(0, -200, 0), name: 'HAWICK' },
    { position: new mp.Vector3(-1700, -100, 0), name: 'RICHM' },
    { position: new mp.Vector3(-1100, -50, 0), name: 'golf' },
    { position: new mp.Vector3(1000, -50, 0), name: 'HORS' },
    { position: new mp.Vector3(1650, -50, 0), name: 'LDAM' },
    { position: new mp.Vector3(-200, 0, 0), name: 'WVINE' },
    { position: new mp.Vector3(50, 0, 0), name: 'DTVINE' },
    { position: new mp.Vector3(700, 0, 0), name: 'CHIL' },
    { position: new mp.Vector3(1700, 0, 0), name: 'LACT' },
    { position: new mp.Vector3(-3150, 250, 0), name: 'BHAMCA' },
    { position: new mp.Vector3(-2000, 650, 0), name: 'RGLEN' },
    { position: new mp.Vector3(-3250, 850, 0), name: 'CHU' },
    { position: new mp.Vector3(-3050, 850, 0), name: 'BANHAMC' },
    { position: new mp.Vector3(2150, 1200, 0), name: 'WINDF' },
    { position: new mp.Vector3(-2000, 1300, 0), name: 'TONGVAH' },
    { position: new mp.Vector3(-1550, 1300, 0), name: 'TONGVAV' },
    { position: new mp.Vector3(2600, 1300, 0), name: 'PALMPOW' },
    { position: new mp.Vector3(1400, 1350, 0), name: 'DESRT' },
    { position: new mp.Vector3(-900, 1700, 0), name: 'GREATC' },
    { position: new mp.Vector3(-3000, 2050, 0), name: 'LAGO' },
    { position: new mp.Vector3(800, 2050, 0), name: 'RTRAK' },
    { position: new mp.Vector3(1600, 2400, 0), name: 'JAIL' },
    { position: new mp.Vector3(2600, 2500, 0), name: 'ZQ_UAR' },
    { position: new mp.Vector3(200, 2550, 0), name: 'HARMO' },
    { position: new mp.Vector3(-1300, 2650, 0), name: 'ZANCUDO' },
    { position: new mp.Vector3(-2200, 2700, 0), name: 'ARMYB' },
    { position: new mp.Vector3(3150, 2700, 0), name: 'SANCHIA' },
    { position: new mp.Vector3(-1300, 2800, 0), name: 'MTJOSE' },
    { position: new mp.Vector3(-2600, 3300, 0), name: 'NCHU' },
    { position: new mp.Vector3(2150, 3300, 0), name: 'SANDY' },
    { position: new mp.Vector3(50, 3550, 0), name: 'SLAB' },
    { position: new mp.Vector3(250, 3600, 0), name: 'ALAMO' },
    { position: new mp.Vector3(3400, 3600, 0), name: 'HUMLAB' },
    { position: new mp.Vector3(-2100, 4050, 0), name: 'CANNY' },
    { position: new mp.Vector3(2450, 4050, 0), name: 'GRAPES' },
    { position: new mp.Vector3(-200, 4200, 0), name: 'CALAFB' },
    { position: new mp.Vector3(-1600, 4300, 0), name: 'CCREAK' },
    { position: new mp.Vector3(1300, 4300, 0), name: 'GALFISH' },
    { position: new mp.Vector3(-150, 4350, 0), name: 'MTCHIL' },
    { position: new mp.Vector3(-1800, 4600, 0), name: 'CMSW' },
    { position: new mp.Vector3(2800, 5100, 0), name: 'MTGORDO' },
    { position: new mp.Vector3(-2400, 5150, 0), name: 'PALCOV' },
    { position: new mp.Vector3(3400, 5150, 0), name: 'ELGORL' },
    { position: new mp.Vector3(-1100, 5400, 0), name: 'PALFOR' },
    { position: new mp.Vector3(2350, 5500, 0), name: 'BRADP' },
    { position: new mp.Vector3(-450, 6050, 0), name: 'PALETO' },
    { position: new mp.Vector3(550, 6600, 0), name: 'PROCOB' },
];
/** Toggle helicam with Q */
mp.useInput(mp.input.TOGGLE_HELI_CAM, true, () => {
    if (localPlayerHelicam.vehicle && localPlayerHelicam.vehicle.getPedInSeat(0) === localPlayerHelicam.handle && localPlayerHelicam.vehicle.getClass() === 15) {
        if (helicam) {
            toggleHelicamOff();
        }
    }
});
/** Toggle helicopter light with Z */
mp.useInput(mp.input.TOGGLE_HELI_LIGHT, true, () => {
    if (localPlayerHelicam.vehicle && localPlayerHelicam.vehicle.getPedInSeat(0) === localPlayerHelicam.handle && localPlayerHelicam.vehicle.getClass() === 15) {
        if (helicam) {
            toggleSearchLight();
        }
    }
});
mp.events.add("render", () => {
    if (helicam) {
        drawZoneInformation();
        if (cam !== null && cam.isActive() && cam.isRendering()) {
            mp.game.controls.disableAllControlActions(2);
            var x = mp.game.controls.getDisabledControlNormal(7, 1) * speed_lr;
            var y = mp.game.controls.getDisabledControlNormal(7, 2) * speed_ud;
            var zoomIn = mp.game.controls.getDisabledControlNormal(2, 40) * zoomspeed;
            var zoomOut = mp.game.controls.getDisabledControlNormal(2, 41) * zoomspeed;
            var currentRot = cam.getRot(2);
            currentRot = new mp.Vector3(currentRot.x - y, 0, currentRot.z - x);
            cam.setRot(currentRot.x, currentRot.y, currentRot.z, 2);
            if (zoomIn > 0 || zoomOut > 0) {
                adjustCameraZoom(zoomIn > 0 ? zoomIn : -zoomOut);
            }
            const now = Date.now();
            if (isSpotlightEnabled && now - lastSync >= 100) {
                syncHelicopterLight();
            }
        }
        if (mp.game.controls.isDisabledControlJustPressed(0, toggle_vision)) {
            mp.game.audio.playSoundFrontend(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET", false);
            toggleNightVision();
        }
        if (locked_on_vehicle) {
            if (locked_on_vehicle.handle) {
                cam.pointAt(locked_on_vehicle.handle, 0, 0, 0, true);
                renderVehicleInfo(locked_on_vehicle);
                if (mp.game.controls.isDisabledControlJustPressed(0, toggle_lock_on)) {
                    mp.game.audio.playSoundFrontend(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET", false);
                    locked_on_vehicle = null;
                    cam.destroy();
                    createHelicam(mp.players.local.vehicle);
                }
            }
            else {
                locked_on_vehicle = null;
                cam.destroy();
                createHelicam(mp.players.local.vehicle);
            }
        }
        else {
            let vehicle_detected = pointingAt_cam(cam);
            if (vehicle_detected != null && vehicle_detected.handle != 0) {
                if (mp.game.controls.isDisabledControlJustPressed(0, toggle_lock_on)) {
                    mp.game.audio.playSoundFrontend(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET", false);
                    locked_on_vehicle = vehicle_detected;
                }
            }
        }
        mp.game.graphics.pushScaleformMovieFunction(scaleform, "SET_ALT_FOV_HEADING");
        mp.game.graphics.pushScaleformMovieFunctionParameterFloat(mp.players.local.vehicle.position.z);
        mp.game.graphics.pushScaleformMovieFunctionParameterFloat(cam.getFov());
        mp.game.graphics.pushScaleformMovieFunctionParameterFloat(cam.getRot(2).z);
        mp.game.graphics.popScaleformMovieFunctionVoid();
        mp.game.graphics.drawScaleformMovieFullscreen(scaleform, 255, 255, 255, 255, true);
        if (isSpotlightEnabled) {
            drawSearchLight(cam.getCoord(), cam.getDirection());
        }
    }
    activeLights.forEach(light => {
        const from = new mp.Vector3(light.x, light.y, light.z);
        const direction = new mp.Vector3(light.dirX, light.dirY, light.dirZ);
        drawSearchLight(from, direction);
    });
});
function toggleHelicamOn() {
    mp.toggleHud(false);
    mp.game.graphics.notify(helicam_translations['helicamNoti']);
    mp.game.graphics.setTimecycleModifier("heliGunCam");
    mp.game.graphics.setTimecycleModifierStrength(0.3);
    scaleform = mp.game.graphics.requestScaleformMovie("HELI_CAM");
    while (!mp.game.graphics.hasScaleformMovieLoaded(scaleform))
        mp.game.wait(0);
    createHelicam(mp.players.local.vehicle);
    mp.game.graphics.pushScaleformMovieFunction(scaleform, "SET_CAM_LOGO");
    mp.game.graphics.pushScaleformMovieFunctionParameterInt(1);
    mp.game.graphics.popScaleformMovieFunctionVoid();
    helicam = true;
}
function toggleHelicamOff() {
    mp.toggleHud(true);
    mp.game.invoke("0x0F07E7745A236711");
    mp.game.invoke("0x31B73D1EA9F01DA2");
    mp.game.cam.renderScriptCams(false, false, 0, true, false);
    if (scaleform != null || scaleform != 0) {
        mp.game.graphics.setScaleformMovieAsNoLongerNeeded(scaleform);
    }
    if (cam != null) {
        cam.destroy(true);
        cam = null;
    }
    helicam = false;
    mp.game.graphics.setSeethrough(false);
    mp.game.graphics.setNightvision(false);
    vision_state = 0;
    locked_on_vehicle = null;
    mp.events.originalCallRemote("helicopter:stop_light");
    isSpotlightEnabled = false;
}
mp.toggleHelicamOn = toggleHelicamOn;
mp.toggleHelicamOff = toggleHelicamOff;
function toggleSearchLight() {
    isSpotlightEnabled = !isSpotlightEnabled;
    if (isSpotlightEnabled) {
        syncHelicopterLight();
    }
    else {
        mp.events.originalCallRemote("helicopter:stop_light");
    }
}
function drawSearchLight(from, direction) {
    mp.game.graphics.drawSpotLightWithShadow(from.x, from.y, from.z, direction.x, direction.y, direction.z, 80, 80, 80, 230, 50, 10, 10, 50, 0);
}
function drawZoneInformation() {
    let street = mp.game.pathfind.getStreetNameAtCoord(mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z, 0, 0);
    let streetName = mp.game.ui.getStreetNameFromHashKey(street.streetName);
    let currentZone = mp.game.gxt.get(mp.game.zone.getNameOfZone(mp.players.local.position.x, mp.players.local.position.y, mp.players.local.position.z));
    mp.game.graphics.drawText(`${currentZone}\n${streetName}`, [0.5, 0.735], {
        font: 4,
        color: [213, 213, 213, 185],
        scale: [0.5, 0.5],
        outline: true
    });
    if (mp.players.local.position.z >= 50) {
        let ppos = mp.players.local.position;
        for (let zone of ZONES) {
            if (mp.game.system.vdist(zone.position.x, zone.position.y, 0, ppos.x, ppos.y, ppos.z) < 1500) {
                let prettyZone = mp.game.gxt.get(zone.name);
                mp.game.graphics.drawText(`${prettyZone}`, [zone.position.x, zone.position.y, 0], {
                    font: 4,
                    color: [213, 213, 213, 180],
                    scale: [0.4, 0.4],
                    outline: true
                });
            }
        }
    }
}
function createHelicam(helicopter) {
    cam = mp.cameras.new("DEFAULT_SCRIPTED_FLY_CAMERA", mp.players.local.position, new mp.Vector3(0, 0, mp.players.local.getHeading()), 60);
    cam.setActive(true);
    cam.setRot(0.0, 0.0, helicopter.getHeading(), 2);
    cam.setFov(fov);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    cam.attachTo(helicopter.handle, 0.0, 2.75, -1, true);
}
function toggleNightVision() {
    vision_state = vision_state === 0 ? 1 : 0;
    mp.game.graphics.setNightvision(vision_state === 1);
}
Math.degrees = function (radians) {
    return (radians * 180) / Math.PI;
};
function renderVehicleInfo(vehicle) {
    let vehname = mp.game.ui.getLabelText(mp.game.vehicle.getDisplayNameFromVehicleModel(vehicle.model));
    mp.game.graphics.drawText(helicam_translations['model'] + vehname, [0.5, 0.9], {
        font: 0,
        color: [255, 255, 255, 185],
        scale: [0.0, 0.55],
        outline: true,
    });
}
function pointingAt_cam(camera) {
    let distance = 250;
    let position = camera.getCoord();
    let direction = camera.getDirection();
    let farAway = new mp.Vector3(direction.x * distance + position.x, direction.y * distance + position.y, direction.z * distance + position.z);
    let result = mp.raycasting.testPointToPoint(position, farAway, [1, 16]);
    if (result) {
        if (result.entity.handle === localPlayerHelicam.handle)
            return null;
        if (result.entity.type === "vehicle") {
            return result.entity;
        }
        return null;
    }
    return null;
}
function adjustCameraZoom(zoomAmount) {
    if (zoomAmount === 0)
        return;
    let currentFov = cam.getFov();
    currentFov -= zoomAmount;
    currentFov = Math.max(fov_min, Math.min(currentFov, fov_max));
    cam.setFov(currentFov);
}
mp.rpc("player:set_server_language", (lang) => {
    helicam_translations = mp.getTranslations(['model', 'helicamNoti'], lang);
});
/* Helicopter lights sync */
function syncHelicopterLight() {
    if (cam == null)
        return;
    const from = cam.getCoord();
    const direction = cam.getDirection();
    mp.events.originalCallRemote("helicopter:sync_light", from.x, from.y, from.z, direction.x, direction.y, direction.z);
    lastSync = Date.now();
}
mp.events.add("helicopter:update_light", (id, x, y, z, dirX, dirY, dirZ, ownerId) => {
    if (ownerId == mp.players.local.remoteId)
        return;
    let light = activeLights.find(l => l.id === id);
    if (!light) {
        activeLights.push({ id, x, y, z, dirX, dirY, dirZ, lastUpdate: Date.now() });
    }
    else {
        light.x = x;
        light.y = y;
        light.z = z;
        light.dirX = dirX;
        light.dirY = dirY;
        light.dirZ = dirZ;
        light.lastUpdate = Date.now();
    }
});
mp.events.add("helicopter:remove_light", (id) => {
    activeLights = activeLights.filter(l => l.id !== id);
});
setInterval(() => {
    const now = Date.now();
    activeLights = activeLights.filter(light => now - light.lastUpdate < 5000);
}, 1000);

}
helicam.js
{
let planes = [
    mp.game.joaat("besra"),
    mp.game.joaat("hydra"),
    mp.game.joaat("lazer"),
    mp.game.joaat("pyro"),
    mp.game.joaat("strikeforce"),
    mp.game.joaat("akula"),
    mp.game.joaat("hunter"),
    mp.game.joaat("savage"),
    mp.game.joaat("annihilator2")
];
mp.events.add("render", () => {
    // if player is in compatible airplane
    if (mp.players.local.vehicle && planes.includes(mp.players.local.vehicle.model)) {
        let firstPerson = mp.game.invoke("0x8D4D46230B2C353A") === 4; // GET_FOLLOW_PED_CAM_VIEW_MODE
        if (firstPerson) {
            mp.vehicles.forEachInStreamRange(veh => {
                // check if veh is in air and is plane or helicopter
                if (mp.vehicles.exists(veh) && veh.handle && veh !== mp.players.local.vehicle && veh.isInAir()) {
                    if (veh.getClass() === 15 || veh.getClass() === 16) {
                        let altitudeFt = (veh.position.z * 3.281).toFixed(0);
                        let speedKt = (veh.getSpeed() * 1.944).toFixed(0);
                        let textInfo = `${veh.getNumberPlateText()}~n~${altitudeFt}ft~n~${speedKt}kt`;
                        mp.game.graphics.drawText(textInfo, [veh.position.x, veh.position.y, veh.position.z], {
                            font: 2,
                            color: [175, 242, 119, 255],
                            scale: [0.25, 0.25],
                            outline: true
                        });
                    }
                }
            });
        }
    }
});

}
planeradar.js
{
let lastRadarInfo = {
    vehicle: null,
    speed: 0,
    distance: 0
};
let hideSpeedTimer = undefined;
var language = "es";
let speedKm = 0;
let unit = "km/h";
let distance = 0;
mp.events.add("render", () => {
    // detect if player has radar gun in hand
    if (mp.players.local.weapon === 1193553863) {
        mp.game.controls.disableControlAction(0, 24, true); // fire
        if (mp.game.controls.isControlPressed(0, 25)) {
            let raycast = pointingAt(200);
            if (raycast && raycast.entity && raycast.entity.type === "vehicle") {
                let v = raycast.entity;
                mp.game.graphics.drawLine(v.position.x, v.position.y, v.position.z + 1, v.position.x, v.position.y, v.position.z + 3, 255, 255, 255, 255);
                let vehName = mp.game.ui.getLabelText(mp.game.vehicle.getDisplayNameFromVehicleModel(v.model));
                if (language === "es") {
                    speedKm = parseFloat((v.getSpeed() * 3.6).toFixed(0));
                    unit = "km/h";
                }
                else if (language === "en") {
                    speedKm = parseFloat((v.getSpeed() * 2.236936).toFixed(0));
                    unit = "mph";
                }
                if (speedKm > lastRadarInfo.speed || v !== lastRadarInfo.vehicle) {
                    lastRadarInfo.vehicle = v;
                    let lPos = mp.players.local.position;
                    if (language === "es") {
                        distance = mp.game.system.vdist(v.position.x, v.position.y, v.position.z, lPos.x, lPos.y, lPos.z);
                    }
                    else if (language === "en") {
                        distance = mp.game.system.vdist(v.position.x, v.position.y, v.position.z, lPos.x, lPos.y, lPos.z);
                        distance = distance * 3.28084;
                    }
                    showSpeed(speedKm, distance);
                }
                mp.game.graphics.drawText(`${vehName}\n${speedKm} ${unit}`, [v.position.x, v.position.y, v.position.z + 3.5], {
                    font: 0,
                    color: [255, 255, 255, 185],
                    scale: [0.2, 0.2],
                    outline: true
                });
            }
        }
    }
});
mp.rpc("player:set_server_language", (lang) => {
    language = lang;
});
function pointingAt(distance) {
    const camera = mp.cameras.new("gameplay");
    let position = camera.getCoord();
    let direction = camera.getDirection();
    let farAway = new mp.Vector3((direction.x * distance) + (position.x), (direction.y * distance) + (position.y), (direction.z * distance) + (position.z));
    let result = mp.raycasting.testPointToPoint(position, farAway, null, 2);
    camera.destroy();
    return result; // and return the result ( undefined, if no hit )
}
function showSpeed(speed, distance) {
    mp.browserCall("radargunVM", "setLocale", language);
    mp.browserCall("radargunVM", "toggle", true);
    mp.browserExecute("radargunVM.speed = " + speed + ";");
    mp.browserExecute("radargunVM.distance = " + distance.toFixed(0) + ";");
    clearTimeout(hideSpeedTimer);
    hideSpeedTimer = setTimeout(() => {
        mp.browserCall("radargunVM", "toggle", false);
        hideSpeedTimer = null;
    }, 5000);
}

}
ui_radargun.js
{
const MAX_BOAT_JUMP = 1;
setInterval(() => {
    const player = mp.players.local;
    const vehicle = player.vehicle;
    if (vehicle != null && vehicle.getClass() == 14 && vehicle.isInWater() && getBoatHeightAboveWater(vehicle) > 0.019999999552965164) {
        const velocity = vehicle.getVelocity();
        vehicle.setVelocity(velocity.x, velocity.y, Math.min(velocity.z, MAX_BOAT_JUMP));
    }
}, 100);
function getBoatHeightAboveWater(vehicle) {
    const waterHeight = mp.game.water.getWaterHeight(vehicle.position.x, vehicle.position.y, vehicle.position.z);
    return vehicle.position.z - waterHeight;
}

}
vehicle_no_boat_jump.js
{
let lastSelectedGear = -1;
const changeGearLeftHand = "veh@driveby@first_person@passenger_rear_left_handed@smg";
const changeGearRightHand = "veh@driveby@first_person@passenger_rear_right_handed@smg";
mp.events.add("render", () => {
    const player = mp.players.local;
    const vehicle = player.vehicle;
    if (vehicle != null && vehicle.gear != lastSelectedGear) {
        playGearChangeAnimation(vehicle);
        lastSelectedGear = vehicle.gear;
    }
});
function playGearChangeAnimation(vehicle) {
    const driverHandle = vehicle.getPedInSeat(-1);
    if (driverHandle == 0)
        return;
    const driver = mp.players.atHandle(driverHandle);
    const isCar = isVehicleACar(vehicle);
    if (!isCar)
        return;
    const isLeftHandDrive = isVehicleLeftHandDrive(vehicle);
    mp.events.call('animation:play', driver.id, isLeftHandDrive ? changeGearLeftHand : changeGearRightHand, "outro_0", 4.0, 32, 0, 1, 0);
}
function isVehicleLeftHandDrive(vehicle) {
    const bone = vehicle.getBoneIndexByName('seat_dside_f');
    const position = vehicle.getWorldPositionOfBone(bone);
    return vehicle.getOffsetFromGivenWorldCoords(position.x, position.y, position.z).x > 0.0099999997764825821;
}
function isVehicleACar(vehicle) {
    const vehiclesClasses = new Set([0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 17, 18, 19, 20]);
    return vehiclesClasses.has(vehicle.getClass());
}

}
vehicle_gear.js
{
System.register(["./vehicle_handling_ref", "./handling_reference"], function (exports_1, context_1) {
    "use strict";
    var vehicle_handling_ref_1, handling_reference_1, IDX_TO_NAME, ANTICHEAT_HANDLING_ENABLED, ABS_EPS, REL_EPS_DEFAULT, REL_EPS_STRICT, STRICT_THRESHOLD, CHECK_INTERVAL_MS;
    var __moduleName = context_1 && context_1.id;
    function nearlyEqual(a, b) {
        const maxVal = Math.max(Math.abs(a), Math.abs(b));
        const relEps = maxVal > STRICT_THRESHOLD ? REL_EPS_STRICT : REL_EPS_DEFAULT;
        const diff = Math.abs(a - b);
        const rel = maxVal * relEps;
        return diff <= Math.max(ABS_EPS, rel);
    }
    function readActualArray(v) {
        const out = new Array(IDX_TO_NAME.length);
        for (let i = 0; i < IDX_TO_NAME.length; i++) {
            const name = IDX_TO_NAME[i];
            out[i] = Number(v.getHandling(name));
        }
        return out;
    }
    function getExpectedArray(model) {
        return handling_reference_1.getHandlingReference(model) ?? null;
    }
    function compareHandling(model, actual, expected) {
        const mismatches = [];
        for (let i = 0; i < IDX_TO_NAME.length; i++) {
            const e = expected[i];
            const a = actual[i];
            if (Number.isNaN(e))
                continue; // skip no-ref
            if (!nearlyEqual(a, e)) {
                mismatches.push({
                    index: i,
                    name: IDX_TO_NAME[i],
                    expected: e,
                    actual: a,
                });
            }
        }
        return mismatches;
    }
    return {
        setters: [
            function (vehicle_handling_ref_1_1) {
                vehicle_handling_ref_1 = vehicle_handling_ref_1_1;
            },
            function (handling_reference_1_1) {
                handling_reference_1 = handling_reference_1_1;
            }
        ],
        execute: function () {
            handling_reference_1.initHandlingReference(vehicle_handling_ref_1.VEHICLE_HANDLING_REF);
            IDX_TO_NAME = [
                "fInitialDriveMaxFlatVel",
                "fBrakeBiasFront",
                "fSteeringLock",
                "fTractionCurveLateral",
                "fTractionBiasFront",
                "fSuspensionCompDamp",
                "fSuspensionReboundDamp",
                "fSuspensionBiasFront",
                "fAntiRollBarBiasFront",
                "fMass",
                "fInitialDragCoeff",
                "fDownForceModifier",
                "fPopUpLightRotation",
                "fPercentSubmerged",
                "fDriveBiasFront",
                "fInitialDriveForce",
                "fDriveInertia",
                "fClutchChangeRateScaleUpShift",
                "fClutchChangeRateScaleDownShift",
                "fBrakeForce",
                "fHandBrakeForce",
                "fTractionCurveMax",
                "fTractionCurveMin",
                "fTractionSpringDeltaMax",
                "fLowSpeedTractionLossMult",
                "fTractionLossMult",
                "fSuspensionForce",
                "fSuspensionUpperLimit",
                "fSuspensionLowerLimit",
                "fSuspensionRaise",
                "fAntiRollBarForce",
                "fRollCentreHeightFront",
                "fRollCentreHeightRear",
                "fCollisionDamageMult",
                "fWeaponDamageMult",
                "fDeformationDamageMult",
                "fEngineDamageMult",
                "fPetrolTankVolume",
                "fOilVolume",
            ];
            ANTICHEAT_HANDLING_ENABLED = true;
            ABS_EPS = 0.02; // 2%
            REL_EPS_DEFAULT = 0.015; // 1.5%
            REL_EPS_STRICT = 0.005; // 0.5%
            STRICT_THRESHOLD = 500; // if the value > 500, use 0.5%
            // Example of periodic use
            CHECK_INTERVAL_MS = 5000;
            mp.setInterval(() => {
                if (!ANTICHEAT_HANDLING_ENABLED)
                    return;
                const v = mp.players.local.vehicle;
                if (!v || !mp.vehicles.exists(v))
                    return;
                const expected = getExpectedArray(v.model);
                if (!expected)
                    return;
                const actual = readActualArray(v);
                const mismatches = compareHandling(v.model, actual, expected);
                if (mismatches.length >= 1) {
                    const mismatchesIndices = mismatches.map((m) => m.index);
                    mp.events.originalCallRemote("anticheat:handling_mismatch", v.model, JSON.stringify(mismatchesIndices));
                }
            }, CHECK_INTERVAL_MS);
            mp.rpc("anticheat:handling_enabled", (val) => {
                ANTICHEAT_HANDLING_ENABLED = val;
            });
        }
    };
});

}
anticheat_handling.js
vehicle_handling_ref
{
/// <reference path="../node_modules/@ragempcommunity/types-client/index.d.ts" />
/**
 * This file contains the interface to set the position info.
 * Default compass system by ynhhoJ
 */
var player = mp.players.local, street, zone, show = false, minimap = getMinimapAnchor(), isCompassShown = false;
player.bigMap = false;
function syncAnchorAndResolution() {
    if (!mp.players.local.uiReady) {
        return;
    }
    let resolution = mp.game.graphics.getScreenActiveResolution(0, 0);
    let anchor = getMinimapAnchor();
    mp.browserSet("hudVM", "minimapAnchor", anchor);
    mp.browserSet("hudVM", "resolution", resolution);
}
// sync position of radar for the UI
syncAnchorAndResolution();
mp.setInterval(() => {
    syncAnchorAndResolution();
}, 2000);
// Position Info Update
mp.setInterval(() => {
    if (show) {
        //street = mp.game.pathfind.getStreetNameAtCoord(player.position.x, player.position.y, player.position.z, 0, 0);
        street = mp.game.pathfind.getStreetNameAtCoord(player.position.x, player.position.y, player.position.z);
        let streetName = mp.game.ui.getStreetNameFromHashKey(street.streetName);
        zone = mp.game.gxt.get(mp.game.zone.getNameOfZone(player.position.x, player.position.y, player.position.z));
        // force zone in cayo perico
        if (zone.indexOf("Yankton") !== -1) {
            zone = "Cayo Perico";
            streetName = "";
        }
        mp.browserExecute("hudVM.zone='" + zone + "'");
        mp.browserExecute("hudVM.street='" + streetName + "'");
    }
}, 2000);
var radarOn = true;
mp.events.add("ui:on_toggle_radar", (toggle) => {
    radarOn = toggle;
});
mp.events.add("render", () => {
    if (player.vehicle && !player.bigMap) {
        if (!show) {
            show = true;
            mp.browserExecute("hudVM.showLocation=true");
            let activeRes = mp.game.graphics.getScreenActiveResolution(0, 0);
            mp.browserSet("hudVM", "x", Math.round(minimap.rightX * activeRes.x));
            mp.browserSet("hudVM", "y", Math.round(minimap.topY * activeRes.y));
        }
        //  Compass render
        if (!radarOn)
            return;
        if (!isCompassShown) {
            isCompassShown = true;
            mp.browserExecute("hudVM.isCompassShown=true");
        }
        const pxDegree = compass.width / compass.fov;
        let playerHeadingDegrees = 0;
        if (compass.followGameplayCam) {
            const camRot = mp.cameras.new('gameplay').getRot(2);
            playerHeadingDegrees = 360.0 - ((camRot.z + 360.0) % 360.0);
        }
        else {
            playerHeadingDegrees = 360.0 - mp.players.local.getHeading();
        }
        let tickDegree = playerHeadingDegrees - compass.fov / 2;
        const tickDegreeRemainder = compass.ticksBetweenCardinals - (tickDegree % compass.ticksBetweenCardinals);
        let tickPosition = compass.position.x + tickDegreeRemainder * pxDegree;
        tickDegree += tickDegreeRemainder;
        mp.game.graphics.drawRect(bg.x, compass.position.y, bg.width, bg.height, bg.color.r, bg.color.g, bg.color.b, bg.color.a);
        while (tickPosition < compass.position.x + compass.width) {
            if ((tickDegree % 90.0) === 0) {
                // Draw cardinal
                mp.game.graphics.drawText(degreesToIntercardinalDirection(tickDegree), [tickPosition, compass.position.y - 0.012], {
                    font: 2,
                    color: compass.cardinal.textColour,
                    scale: [0.35, 0.35],
                    outline: true,
                });
            }
            else if ((tickDegree % 45.0) === 0 || compass.intercardinal.show) {
                // Draw intercardinal ticks
                if (compass.intercardinal.tickShow) {
                    mp.game.graphics.drawRect(tickPosition, compass.position.y, compass.intercardinal.tickSize.w, compass.intercardinal.tickSize.h, compass.intercardinal.tickColour.r, compass.intercardinal.tickColour.g, compass.intercardinal.tickColour.b, compass.intercardinal.tickColour.a);
                }
            }
            else {
                mp.game.graphics.drawRect(tickPosition, compass.position.y, compass.tickSize.w, compass.tickSize.h, compass.tickColour.r, compass.tickColour.g, compass.tickColour.b, compass.tickColour.a);
            }
            // Advance to the next tick
            tickDegree += compass.ticksBetweenCardinals;
            tickPosition += pxDegree * compass.ticksBetweenCardinals;
        }
    }
    else {
        if (show) {
            show = false;
            mp.browserExecute("hudVM.showLocation=false");
        }
        if (isCompassShown) {
            isCompassShown = false;
            mp.browserExecute("hudVM.isCompassShown=false");
        }
        if (player.bigMap) {
            setMapUiState(false, true);
        }
    }
});
// big map with Z Key
mp.useInput(mp.input.ZOOM_HUD, true, function () {
    if (mp.gui.cursor.visible)
        return;
    toggleBigMap();
});
const compass = { cardinal: {}, intercardinal: {} };
// Configuration. Please be careful when editing. It does not check for errors.
compass.position = { x: minimap.leftX, y: minimap.topY - 0.015 - 0.015, centered: false };
compass.width = minimap.rightX - minimap.leftX;
compass.fov = 180;
compass.followGameplayCam = true;
compass.ticksBetweenCardinals = 9.0;
compass.tickColour = {
    r: 255, g: 255, b: 255, a: 255,
};
compass.tickSize = { w: 0.001, h: 0.003 };
compass.cardinal.textColour = [255, 255, 255, 185];
compass.cardinal.tickShow = true;
compass.cardinal.tickSize = { w: 0.001, h: 0.012 };
compass.cardinal.tickColour = {
    r: 255, g: 255, b: 255, a: 255,
};
compass.intercardinal.show = false;
compass.intercardinal.tickShow = true;
compass.intercardinal.tickSize = { w: 0.001, h: 0.006 };
compass.intercardinal.tickColour = {
    r: 255, g: 255, b: 255, a: 255,
};
let bg = {};
bg.width = compass.width;
bg.x = minimap.rightX - (bg.width / 2);
bg.height = 0.025;
bg.color = {
    r: 9, g: 9, b: 19, a: 64,
};
// End of configuration
function degreesToIntercardinalDirection(dgr) {
    dgr %= 360.0;
    if ((dgr >= 0.0 && dgr < 22.5) || dgr >= 337.5)
        return 'N ';
    if (dgr >= 22.5 && dgr < 67.5)
        return ' ';
    if (dgr >= 67.5 && dgr < 112.5)
        return 'E ';
    if (dgr >= 157.5 && dgr < 202.5)
        return 'S ';
    if (dgr >= 112.5 && dgr < 157.5)
        return ' ';
    if ((dgr >= 202.5 && dgr < 247.5) || (dgr > -112.5 && dgr <= -65.7))
        return ' ';
    if ((dgr >= 247.5 && dgr <= 292.5) || (dgr > -65.7 && dgr <= -22.5))
        return 'O ';
    if ((dgr >= 292.5 && dgr < 337.5) || (dgr > -22.5 && dgr <= 0))
        return ' ';
}
// https://github.com/glitchdetector/fivem-minimap-anchor
function getMinimapAnchor() {
    let sfX = 1.0 / 20.0;
    let sfY = 1.0 / 20.0;
    let safeZone = mp.game.graphics.getSafeZoneSize();
    let aspectRatio = mp.game.graphics.getScreenAspectRatio(false);
    let resolution = mp.game.graphics.getScreenActiveResolution(0, 0);
    let scaleX = 1.0 / resolution.x;
    let scaleY = 1.0 / resolution.y;
    let minimap = {
        width: scaleX * (resolution.x / (4 * aspectRatio)),
        height: scaleY * (resolution.y / 5.674),
        scaleX: scaleX,
        scaleY: scaleY,
        leftX: scaleX * (resolution.x * (sfX * (Math.abs(safeZone - 1.0) * 10))),
        bottomY: 1.0 - scaleY * (resolution.y * (sfY * (Math.abs(safeZone - 1.0) * 10))),
    };
    minimap.rightX = minimap.leftX + minimap.width;
    minimap.topY = minimap.bottomY - minimap.height;
    return minimap;
}
mp.getMinimapAnchor = getMinimapAnchor;
function toggleBigMap() {
    if (player.vehicle && mp.isTowTruck(player.vehicle.model) || player.vehicle && mp.isTruck(player.vehicle.model))
        return;
    if (mp.isTypingOnPhone())
        return;
    player.bigMap = !player.bigMap;
    mp.game.ui.setRadarBigmapEnabled(player.bigMap, false);
    // disable zone name and money in CEF if enable big map
    if (player.bigMap) {
        setMapUiState(false, true);
        mp.browserExecute("casinoVM.showInformation=false"); // disable casino balance
        if (show) {
            show = false;
            mp.browserExecute("hudVM.showLocation=false");
        }
    }
    else {
        // only toggle needs and money because location is activated in render
        setMapUiState(true, false);
        mp.browserExecute("casinoVM.showInformation=true");
    }
}
mp.rpc("radarmap:minimize", () => {
    player.bigMap = false;
    mp.game.ui.setRadarBigmapEnabled(false, false);
    setMapUiState(true, false);
});
function setMapUiState(showMap, isBigMap) {
    mp.browserExecute(`hudVM.showMapUi=${showMap}`);
    mp.browserExecute(`hudVM.setBigMap(${isBigMap})`);
}

}
{
!function(e){var t={};function s(i){if(t[i])return t[i].exports;var n=t[i]={i:i,l:!1,exports:{}};return e[i].call(n.exports,n,n.exports,s),n.l=!0,n.exports}s.m=e,s.c=t,s.d=function(e,t,i){s.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:i})},s.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s(s.s=0)}([function(e,t,s){"use strict";var i;s.r(t),function(e){e[e.None=0]="None",e[e.BronzeMedal=1]="BronzeMedal",e[e.GoldMedal=2]="GoldMedal",e[e.SilverMedal=3]="SilverMedal",e[e.Alert=4]="Alert",e[e.Crown=5]="Crown",e[e.Ammo=6]="Ammo",e[e.Armour=7]="Armour",e[e.Barber=8]="Barber",e[e.Clothes=9]="Clothes",e[e.Franklin=10]="Franklin",e[e.Bike=11]="Bike",e[e.Car=12]="Car",e[e.Gun=13]="Gun",e[e.Heart=14]="Heart",e[e.Makeup=15]="Makeup",e[e.Mask=16]="Mask",e[e.Michael=17]="Michael",e[e.Star=18]="Star",e[e.Tatoo=19]="Tatoo",e[e.Trevor=20]="Trevor",e[e.Lock=21]="Lock",e[e.Tick=22]="Tick"}(i||(i={}));var n,h=i;!function(e){e[e.ChaletLondon=0]="ChaletLondon",e[e.HouseScript=1]="HouseScript",e[e.Monospace=2]="Monospace",e[e.CharletComprimeColonge=4]="CharletComprimeColonge",e[e.Pricedown=7]="Pricedown"}(n||(n={}));var o,r=n;class a{constructor(e,t,s,i=255){this.R=e,this.G=t,this.B=s,this.A=i}}a.Empty=new a(0,0,0,0),a.Transparent=new a(0,0,0,0),a.Black=new a(0,0,0,255),a.White=new a(255,255,255,255),a.WhiteSmoke=new a(245,245,245,255);class l{constructor(e,t,s,i,n=0,h=new a(255,255,255)){this.TextureDict=e,this.TextureName=t,this.pos=s,this.size=i,this.heading=n,this.color=h,this.visible=!0}LoadTextureDictionary(){mp.game.graphics.requestStreamedTextureDict(this._textureDict,!0)}set TextureDict(e){this._textureDict=e,this.IsTextureDictionaryLoaded||this.LoadTextureDictionary()}get TextureDict(){return this._textureDict}get IsTextureDictionaryLoaded(){return mp.game.graphics.hasStreamedTextureDictLoaded(this._textureDict)}Draw(e,t,s,i,n,h,o){e=e||this.TextureDict,t=t||this.TextureName,s=s||this.pos,i=i||this.size,n=n||this.heading,h=h||this.color,(o=o||!0)&&(mp.game.graphics.hasStreamedTextureDictLoaded(e)||mp.game.graphics.requestStreamedTextureDict(e,!0));const r=1080*(mp.game.resolution.width/mp.game.resolution.height),a=this.size.Width/r,l=this.size.Height/1080,c=this.pos.X/r+.5*a,u=this.pos.Y/1080+.5*l;mp.game.graphics.drawSprite(e,t,c,u,a,l,n,h.R,h.G,h.B,h.A)}}class c{constructor(){this.handlers=[]}on(e){this.handlers.push(e)}off(e){this.handlers=this.handlers.filter(t=>t!==e)}emit(...e){this.handlers.slice(0).forEach(t=>t(...e))}expose(){return this}}class u{constructor(e,t){this.X=0,this.Y=0,this.X=e,this.Y=t}static Parse(e){if("object"==typeof e){if(e.length)return new u(e[0],e[1]);if(e.X&&e.Y)return new u(e.X,e.Y)}else if("string"==typeof e&&-1!==e.indexOf(",")){const t=e.split(",");return new u(parseFloat(t[0]),parseFloat(t[1]))}return new u(0,0)}}class m{constructor(e=0,t=0){this.Width=e,this.Height=t}}class d{constructor(){this.enabled=!0}}class g extends d{constructor(e,t,s){super(),this.enabled=!0,this.pos=e,this.size=t,this.color=s}Draw(e,t,s){e||(e=new m(0,0)),t||s||(e=new u(this.pos.X+e.Width,this.pos.Y+e.Height),t=this.size,s=this.color);const i=t.Width/1280,n=t.Height/720,h=e.X/1280+.5*i,o=e.Y/720+.5*n;mp.game.graphics.drawRect(h,o,i,n,s.R,s.G,s.B,s.A)}}class f extends g{constructor(e,t,s){super(e,t,s)}Draw(e,t,s){e||(e=new m),!e||t||s||(e=new u(this.pos.X+e.Width,this.pos.Y+e.Height),t=this.size,s=this.color);const i=1080*(mp.game.resolution.width/mp.game.resolution.height),n=t.Width/i,h=t.Height/1080,o=e.X/i+.5*n,r=e.Y/1080+.5*h;mp.game.graphics.drawRect(o,r,n,h,s.R,s.G,s.B,s.A)}}class _ extends d{constructor(e,t,s,i,n,h){super(),this.caption=e,this.pos=t,this.scale=s,this.color=i||new a(255,255,255,255),this.font=n||0,this.centered=h||!1}Draw(e,t,s,i,n,h){!e||t||s||i||n||h||(t=new u(this.pos.X+e.Width,this.pos.Y+e.Height),s=this.scale,i=this.color,n=this.font,h=this.centered);const o=t.X/1280,r=t.Y/720;mp.game.ui.setTextFont(parseInt(n)),mp.game.ui.setTextScale(s,s),mp.game.ui.setTextColour(i.R,i.G,i.B,i.A),mp.game.ui.setTextCentre(h),mp.game.ui.setTextEntry("STRING"),mp.game.ui.addTextComponentSubstringPlayerName(e),mp.game.ui.drawText(o,r)}}exports=_,function(e){e[e.Left=0]="Left",e[e.Centered=1]="Centered",e[e.Right=2]="Right"}(o||(o={}));class p extends _{constructor(e,t,s,i,n,h){super(e,t,s,i||new a(255,255,255),n||0,!1),this.TextAlignment=o.Left,h&&(this.TextAlignment=h)}Draw(e,t,s,i,n,h,r,a,l){let c=e,d=h,g=h;e||(e=new m(0,0)),e&&!t&&(g=this.TextAlignment,c=this.caption,t=new u(this.pos.X+e.Width,this.pos.Y+e.Height),s=this.scale,i=this.color,n=this.font,1==d||0==d?d=this.centered:(d=void 0,r=this.DropShadow,a=this.Outline,l=this.WordWrap));const f=1080*(mp.game.resolution.width/mp.game.resolution.height),_=this.pos.X/f,p=this.pos.Y/1080;if(mp.game.ui.setTextFont(parseInt(n)),mp.game.ui.setTextScale(1,s),mp.game.ui.setTextColour(i.R,i.G,i.B,i.A),void 0!==d)mp.game.ui.setTextCentre(d);else{switch(r&&mp.game.ui.setTextDropshadow(2,0,0,0,0),a&&console.warn("not working!"),g){case o.Centered:mp.game.ui.setTextCentre(!0);break;case o.Right:mp.game.ui.setTextRightJustify(!0),mp.game.ui.setTextWrap(0,_)}if(l){const e=(this.pos.X+l.Width)/f;mp.game.ui.setTextWrap(_,e)}}mp.game.ui.setTextEntry("STRING"),mp.game.ui.addTextComponentSubstringPlayerName(c),mp.game.ui.drawText(_,p)}static AddLongString(e){for(var t=0;t<e.length;t+=99){e.substr(t,Math.min(99,e.length-t))}}}class I{constructor(e,t=""){this.BackColor=I.DefaultBackColor,this.HighlightedBackColor=I.DefaultHighlightedBackColor,this.ForeColor=I.DefaultForeColor,this.HighlightedForeColor=I.DefaultHighlightedForeColor,this.RightLabel="",this.LeftBadge=h.None,this.RightBadge=h.None,this.Enabled=!0,this._rectangle=new f(new u(0,0),new m(431,38),new a(150,0,0,0)),this._text=new p(e,new u(8,0),.33,a.WhiteSmoke,r.ChaletLondon,o.Left),this.Description=t,this._selectedSprite=new l("commonmenu","gradient_nav",new u(0,0),new m(431,38)),this._badgeLeft=new l("commonmenu","",new u(0,0),new m(40,40)),this._badgeRight=new l("commonmenu","",new u(0,0),new m(40,40)),this._labelText=new p("",new u(0,0),.35,a.White,0,o.Right)}get Text(){return this._text.caption}set Text(e){this._text.caption=e}SetVerticalPosition(e){this._rectangle.pos=new u(this.Offset.X,e+144+this.Offset.Y),this._selectedSprite.pos=new u(0+this.Offset.X,e+144+this.Offset.Y),this._text.pos=new u(8+this.Offset.X,e+147+this.Offset.Y),this._badgeLeft.pos=new u(0+this.Offset.X,e+142+this.Offset.Y),this._badgeRight.pos=new u(385+this.Offset.X,e+142+this.Offset.Y),this._labelText.pos=new u(420+this.Offset.X,e+148+this.Offset.Y)}addEvent(e,...t){this._event={event:e,args:t}}fireEvent(){this._event&&mp.events.call(this._event.event,this,...this._event.args)}Draw(){this._rectangle.size=new m(431+this.Parent.WidthOffset,38),this._selectedSprite.size=new m(431+this.Parent.WidthOffset,38),this.Hovered&&!this.Selected&&(this._rectangle.color=new a(255,255,255,20),this._rectangle.Draw()),this._selectedSprite.color=this.Selected?this.HighlightedBackColor:this.BackColor,this._selectedSprite.Draw(),this._text.color=this.Enabled?this.Selected?this.HighlightedForeColor:this.ForeColor:new a(163,159,148),this.LeftBadge!=h.None?(this._text.pos=new u(35+this.Offset.X,this._text.pos.Y),this._badgeLeft.TextureDict=this.BadgeToSpriteLib(this.LeftBadge),this._badgeLeft.TextureName=this.BadgeToSpriteName(this.LeftBadge,this.Selected),this._badgeLeft.color=this.IsBagdeWhiteSprite(this.LeftBadge)?this.Enabled?this.Selected?this.HighlightedForeColor:this.ForeColor:new a(163,159,148):a.White,this._badgeLeft.Draw()):this._text.pos=new u(8+this.Offset.X,this._text.pos.Y),this.RightBadge!=h.None&&(this._badgeRight.pos=new u(385+this.Offset.X+this.Parent.WidthOffset,this._badgeRight.pos.Y),this._badgeRight.TextureDict=this.BadgeToSpriteLib(this.RightBadge),this._badgeRight.TextureName=this.BadgeToSpriteName(this.RightBadge,this.Selected),this._badgeRight.color=this.IsBagdeWhiteSprite(this.RightBadge)?this.Enabled?this.Selected?this.HighlightedForeColor:this.ForeColor:new a(163,159,148):a.White,this._badgeRight.Draw()),this.RightLabel&&""!==this.RightLabel&&(this._labelText.pos=new u(420+this.Offset.X+this.Parent.WidthOffset,this._labelText.pos.Y),this._labelText.caption=this.RightLabel,this._labelText.color=this._text.color=this.Enabled?this.Selected?this.HighlightedForeColor:this.ForeColor:new a(163,159,148),this._labelText.Draw()),this._text.Draw()}SetLeftBadge(e){this.LeftBadge=e}SetRightBadge(e){this.RightBadge=e}SetRightLabel(e){this.RightLabel=e}BadgeToSpriteLib(e){return"commonmenu"}BadgeToSpriteName(e,t){switch(e){case h.None:return"";case h.BronzeMedal:return"mp_medal_bronze";case h.GoldMedal:return"mp_medal_gold";case h.SilverMedal:return"medal_silver";case h.Alert:return"mp_alerttriangle";case h.Crown:return"mp_hostcrown";case h.Ammo:return t?"shop_ammo_icon_b":"shop_ammo_icon_a";case h.Armour:return t?"shop_armour_icon_b":"shop_armour_icon_a";case h.Barber:return t?"shop_barber_icon_b":"shop_barber_icon_a";case h.Clothes:return t?"shop_clothing_icon_b":"shop_clothing_icon_a";case h.Franklin:return t?"shop_franklin_icon_b":"shop_franklin_icon_a";case h.Bike:return t?"shop_garage_bike_icon_b":"shop_garage_bike_icon_a";case h.Car:return t?"shop_garage_icon_b":"shop_garage_icon_a";case h.Gun:return t?"shop_gunclub_icon_b":"shop_gunclub_icon_a";case h.Heart:return t?"shop_health_icon_b":"shop_health_icon_a";case h.Lock:return"shop_lock";case h.Makeup:return t?"shop_makeup_icon_b":"shop_makeup_icon_a";case h.Mask:return t?"shop_mask_icon_b":"shop_mask_icon_a";case h.Michael:return t?"shop_michael_icon_b":"shop_michael_icon_a";case h.Star:return"shop_new_star";case h.Tatoo:return t?"shop_tattoos_icon_b":"shop_tattoos_icon_";case h.Tick:return"shop_tick_icon";case h.Trevor:return t?"shop_trevor_icon_b":"shop_trevor_icon_a";default:return""}}IsBagdeWhiteSprite(e){switch(e){case h.Lock:case h.Tick:case h.Crown:return!0;default:return!1}}BadgeToColor(e,t){switch(e){case h.Lock:case h.Tick:case h.Crown:return t?new a(255,0,0,0):new a(255,255,255,255);default:return new a(255,255,255,255)}}}I.DefaultBackColor=a.Empty,I.DefaultHighlightedBackColor=a.White,I.DefaultForeColor=a.WhiteSmoke,I.DefaultHighlightedForeColor=a.Black;class w extends I{constructor(e,t=!1,s=""){super(e,s),this.OnCheckedChanged=new c,this.Checked=!1;this._checkedSprite=new l("commonmenu","shop_box_blank",new u(410,95),new m(50,50)),this.Checked=t}get CheckedChanged(){return this.OnCheckedChanged.expose()}SetVerticalPosition(e){super.SetVerticalPosition(e),this._checkedSprite.pos=new u(380+this.Offset.X+this.Parent.WidthOffset,e+138+this.Offset.Y)}Draw(){super.Draw(),this._checkedSprite.pos=this._checkedSprite.pos=new u(380+this.Offset.X+this.Parent.WidthOffset,this._checkedSprite.pos.Y);const e=this.HighlightedForeColor==I.DefaultHighlightedForeColor;this.Selected&&e?this._checkedSprite.TextureName=this.Checked?"shop_box_tickb":"shop_box_blankb":this._checkedSprite.TextureName=this.Checked?"shop_box_tick":"shop_box_blank",this._checkedSprite.color=this.Enabled?this.Selected&&!e?this.HighlightedForeColor:this.ForeColor:new a(163,159,148),this._checkedSprite.Draw()}SetRightBadge(e){return this}SetRightLabel(e){return this}}class x{constructor(e="",t=null){this.DisplayText=e,this.Data=t}}class S{constructor(e){if(0===e.length)throw new Error("ItemsCollection cannot be empty");this.items=e}length(){return this.items.length}getListItems(){const e=[];for(const t of this.items)t instanceof x?e.push(t):"string"==typeof t&&e.push(new x(t.toString()));return e}}class C{static MeasureString(e){let t=0;const s=e.toString().split("");for(const e of s)C.CharMap[e]&&(t+=C.CharMap[e]+1);return t}}C.CharMap={" ":6,"!":6,'"':6,"#":11,$:10,"%":17,"&":13,"'":4,"(":6,")":6,"*":7,"+":10,",":4,"-":6,".":4,"/":7,0:12,1:7,2:11,3:11,4:11,5:11,6:12,7:10,8:11,9:11,":":5,";":4,"<":9,"=":9,">":9,"?":10,"@":15,A:12,B:13,C:14,D:14,E:12,F:12,G:15,H:14,I:5,J:11,K:13,L:11,M:16,N:14,O:16,P:12,Q:15,R:13,S:12,T:11,U:13,V:12,W:18,X:11,Y:11,Z:12,"[":6,"\\":7,"]":6,"^":9,_:18,"`":8,a:11,b:12,c:11,d:12,e:12,f:5,g:13,h:11,i:4,j:4,k:10,l:4,m:18,n:11,o:12,p:12,q:12,r:7,s:9,t:5,u:11,v:10,w:14,x:9,y:10,z:9,"{":6,"|":3,"}":6};class M extends I{constructor(e,t="",s=new S([]),i=0){super(e,t),this.currOffset=0,this.collection=[],this.ScrollingEnabled=!0,this.HoldTimeBeforeScroll=200,this.OnListChanged=new c,this._index=0;this.Collection=s.getListItems(),this.Index=i,this._arrowLeft=new l("commonmenu","arrowleft",new u(110,105),new m(30,30)),this._arrowRight=new l("commonmenu","arrowright",new u(280,105),new m(30,30)),this._itemText=new p("",new u(290,104),.35,a.White,r.ChaletLondon,o.Right)}get Collection(){return this.collection}set Collection(e){if(!e)throw new Error("The collection can't be null");this.collection=e}get SelectedItem(){return this.Collection.length>0?this.Collection[this.Index]:null}get SelectedValue(){return null==this.SelectedItem?null:null==this.SelectedItem.Data?this.SelectedItem.DisplayText:this.SelectedItem.Data}get ListChanged(){return this.OnListChanged.expose()}get Index(){return null==this.Collection?-1:null!=this.Collection&&0==this.Collection.length?-1:this._index%this.Collection.length}set Index(e){if(null==this.Collection)return;if(null!=this.Collection&&0==this.Collection.length)return;this._index=1e5-1e5%this.Collection.length+e;const t=this.Collection.length>=this.Index?this.Collection[this.Index].DisplayText:" ";this.currOffset=C.MeasureString(t)}SetVerticalPosition(e){this._arrowLeft.pos=new u(300+this.Offset.X+this.Parent.WidthOffset,147+e+this.Offset.Y),this._arrowRight.pos=new u(400+this.Offset.X+this.Parent.WidthOffset,147+e+this.Offset.Y),this._itemText.pos=new u(300+this.Offset.X+this.Parent.WidthOffset,e+147+this.Offset.Y),super.SetVerticalPosition(e)}SetRightLabel(e){return this}SetRightBadge(e){return this}Draw(){super.Draw();const e=this.Collection.length>=this.Index?this.Collection[this.Index].DisplayText:" ",t=this.currOffset;this._itemText.color=this.Enabled?this.Selected?this.HighlightedForeColor:this.ForeColor:new a(163,159,148),this._itemText.caption=e,this._arrowLeft.color=this.Enabled?this.Selected?this.HighlightedForeColor:this.ForeColor:new a(163,159,148),this._arrowRight.color=this.Enabled?this.Selected?this.HighlightedForeColor:this.ForeColor:new a(163,159,148),this._arrowLeft.pos=new u(375-t+this.Offset.X+this.Parent.WidthOffset,this._arrowLeft.pos.Y),this.Selected?(this._arrowLeft.Draw(),this._arrowRight.Draw(),this._itemText.pos=new u(405+this.Offset.X+this.Parent.WidthOffset,this._itemText.pos.Y)):this._itemText.pos=new u(420+this.Offset.X+this.Parent.WidthOffset,this._itemText.pos.Y),this._itemText.Draw()}}class O extends I{get Index(){return this._index%this._items.length}set Index(e){this._index=1e8-1e8%this._items.length+e}constructor(e,t,s,i="",n=!1){super(e,i);this._items=t,this._arrowLeft=new l("commonmenutu","arrowleft",new u(0,105),new m(15,15)),this._arrowRight=new l("commonmenutu","arrowright",new u(0,105),new m(15,15)),this._rectangleBackground=new f(new u(0,0),new m(150,9),new a(4,32,57,255)),this._rectangleSlider=new f(new u(0,0),new m(75,9),new a(57,116,200,255)),this._rectangleDivider=new f(new u(0,0),new m(2.5,20),n?a.WhiteSmoke:a.Transparent),this.Index=s}SetVerticalPosition(e){this._rectangleBackground.pos=new u(250+this.Offset.X+this.Parent.WidthOffset,e+158.5+this.Offset.Y),this._rectangleSlider.pos=new u(250+this.Offset.X+this.Parent.WidthOffset,e+158.5+this.Offset.Y),this._rectangleDivider.pos=new u(323.5+this.Offset.X+this.Parent.WidthOffset,e+153+this.Offset.Y),this._arrowLeft.pos=new u(235+this.Offset.X+this.Parent.WidthOffset,155.5+e+this.Offset.Y),this._arrowRight.pos=new u(400+this.Offset.X+this.Parent.WidthOffset,155.5+e+this.Offset.Y),super.SetVerticalPosition(e)}IndexToItem(e){return this._items[e]}Draw(){super.Draw(),this._arrowLeft.color=this.Enabled?this.Selected?a.Black:a.WhiteSmoke:new a(163,159,148),this._arrowRight.color=this.Enabled?this.Selected?a.Black:a.WhiteSmoke:new a(163,159,148);let e=(this._rectangleBackground.size.Width-this._rectangleSlider.size.Width)/(this._items.length-1)*this.Index;this._rectangleSlider.pos=new u(250+this.Offset.X+e+ +this.Parent.WidthOffset,this._rectangleSlider.pos.Y),this.Selected&&(this._arrowLeft.Draw(),this._arrowRight.Draw()),this._rectangleBackground.Draw(),this._rectangleSlider.Draw(),this._rectangleDivider.Draw()}SetRightBadge(e){}SetRightLabel(e){}}class D extends g{constructor(e,t,s){super(e,t,s),this.Items=[]}addItem(e){this.Items.push(e)}Draw(e){if(!this.enabled)return;e=e||new m;const t=1080*(mp.game.resolution.width/mp.game.resolution.height),s=this.size.Width/t,i=this.size.Height/1080,n=(this.pos.X+e.Width)/t+.5*s,h=(this.pos.Y+e.Height)/1080+.5*i;for(var o of(mp.game.graphics.drawRect(n,h,s,i,this.color.R,this.color.G,this.color.B,this.color.A),this.Items))o.Draw(new m(this.pos.X+e.Width,this.pos.Y+e.Height))}}class R{static PlaySound(e,t){mp.game.audio.playSound(-1,e,t,!1,0,!0)}}s.d(t,"default",function(){return T});const b=mp.game.graphics.getScreenActiveResolution(0,0);mp.game.resolution={},mp.game.resolution.width=b.x,mp.game.resolution.height=b.y;class T{constructor(e,t,s,i,n){this.counterPretext="",this.counterOverride=void 0,this.lastUpDownNavigation=0,this.lastLeftRightNavigation=0,this._activeItem=1e3,this.extraOffset=0,this.WidthOffset=0,this.Visible=!0,this.MouseControlsEnabled=!1,this._justOpened=!0,this.safezoneOffset=new u(0,0),this.MaxItemsOnScreen=9,this._maxItem=this.MaxItemsOnScreen,this.AUDIO_LIBRARY="HUD_FRONTEND_DEFAULT_SOUNDSET",this.AUDIO_UPDOWN="NAV_UP_DOWN",this.AUDIO_LEFTRIGHT="NAV_LEFT_RIGHT",this.AUDIO_SELECT="SELECT",this.AUDIO_BACK="BACK",this.AUDIO_ERROR="ERROR",this.MenuItems=[],this.onIndexChange=new c,this.onListChange=new c,this.onSliderChange=new c,this.onSliderSelect=new c,this.onCheckboxChange=new c,this.onItemSelect=new c,this.onMenuClose=new c,this.onMenuChange=new c,this.MouseEdgeEnabled=!0,s instanceof u||(s=u.Parse(s)),this.title=e,this.subtitle=t,this.spriteLibrary=i||"commonmenu",this.spriteName=n||"interaction_bgd",this.offset=new u(s.X,s.Y),this.Children=new Map,this._mainMenu=new D(new u(0,0),new m(700,500),new a(0,0,0,0)),this._logo=new l(this.spriteLibrary,this.spriteName,new u(0+this.offset.X,0+this.offset.Y),new m(431,107)),this._mainMenu.addItem(this._title=new p(this.title,new u(215+this.offset.X,20+this.offset.Y),1.15,new a(255,255,255),1,o.Centered)),""!==this.subtitle&&(this._mainMenu.addItem(new f(new u(0+this.offset.X,107+this.offset.Y),new m(431,37),new a(0,0,0,255))),this._mainMenu.addItem(this._subtitle=new p(this.subtitle,new u(8+this.offset.X,110+this.offset.Y),.35,new a(255,255,255),0,o.Left)),this.subtitle.startsWith("~")&&(this.counterPretext=this.subtitle.substr(0,3)),this._counterText=new p("",new u(425+this.offset.X,110+this.offset.Y),.35,new a(255,255,255),0,o.Right),this.extraOffset+=37),this._upAndDownSprite=new l("commonmenu","shop_arrows_upanddown",new u(190+this.offset.X,147+37*(this.MaxItemsOnScreen+1)+this.offset.Y-37+this.extraOffset),new m(50,50)),this._extraRectangleUp=new f(new u(0+this.offset.X,144+38*(this.MaxItemsOnScreen+1)+this.offset.Y-37+this.extraOffset),new m(431,18),new a(0,0,0,200)),this._extraRectangleDown=new f(new u(0+this.offset.X,162+38*(this.MaxItemsOnScreen+1)+this.offset.Y-37+this.extraOffset),new m(431,18),new a(0,0,0,200)),this._descriptionBar=new f(new u(this.offset.X,123),new m(431,4),a.Black),this._descriptionRectangle=new l("commonmenu","gradient_bgd",new u(this.offset.X,127),new m(431,30)),this._descriptionText=new p("Description",new u(this.offset.X+5,125),.35,new a(255,255,255,255),r.ChaletLondon,o.Left),this._background=new l("commonmenu","gradient_bgd",new u(this.offset.X,144+this.offset.Y-37+this.extraOffset),new m(290,25)),mp.events.add("render",this.render.bind(this)),console.log(`Created Native UI! ${this.title}`)}get CurrentSelection(){return this._activeItem%this.MenuItems.length}set CurrentSelection(e){this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!1,this._activeItem=1e3-1e3%this.MenuItems.length+e,this.CurrentSelection>this._maxItem?(this._maxItem=this.CurrentSelection,this._minItem=this.CurrentSelection-this.MaxItemsOnScreen):this.CurrentSelection<this._minItem&&(this._maxItem=this.MaxItemsOnScreen+this.CurrentSelection,this._minItem=this.CurrentSelection)}get IndexChange(){return this.onIndexChange.expose()}get ListChange(){return this.onListChange.expose()}get SliderChange(){return this.onSliderChange.expose()}get SliderSelect(){return this.onSliderSelect.expose()}get CheckboxChange(){return this.onCheckboxChange.expose()}get ItemSelect(){return this.onItemSelect.expose()}get MenuClose(){return this.onMenuClose.expose()}get MenuChange(){return this.onMenuChange.expose()}RecalculateDescriptionPosition(){this._descriptionBar.pos=new u(this.offset.X,112+this.extraOffset+this.offset.Y),this._descriptionRectangle.pos=new u(this.offset.X,112+this.extraOffset+this.offset.Y),this._descriptionText.pos=new u(this.offset.X+8,118+this.extraOffset+this.offset.Y),this._descriptionBar.size=new m(431+this.WidthOffset,4),this._descriptionRectangle.size=new m(431+this.WidthOffset,30);let e=this.MenuItems.length;e>this.MaxItemsOnScreen+1&&(e=this.MaxItemsOnScreen+2),this._descriptionBar.pos=new u(this.offset.X,38*e+this._descriptionBar.pos.Y),this._descriptionRectangle.pos=new u(this.offset.X,38*e+this._descriptionRectangle.pos.Y),this._descriptionText.pos=new u(this.offset.X+8,38*e+this._descriptionText.pos.Y)}SetMenuWidthOffset(e){if(this.WidthOffset=e,null!=this._logo&&(this._logo.size=new m(431+this.WidthOffset,107)),this._mainMenu.Items[0].pos=new u((this.WidthOffset+this.offset.X+431)/2,20+this.offset.Y),this._counterText&&(this._counterText.pos=new u(425+this.offset.X+e,110+this.offset.Y)),this._mainMenu.Items.length>=2){this._mainMenu.Items[1].size=new m(431+this.WidthOffset,37)}}AddItem(e){this._justOpened&&(this._justOpened=!1),e.Offset=this.offset,e.Parent=this,e.SetVerticalPosition(25*this.MenuItems.length-37+this.extraOffset),this.MenuItems.push(e),e.Description=this.FormatDescription(e.Description),this.RefreshIndex(),this.RecalculateDescriptionPosition()}RefreshIndex(){if(0==this.MenuItems.length)return this._activeItem=1e3,this._maxItem=this.MaxItemsOnScreen,void(this._minItem=0);for(let e=0;e<this.MenuItems.length;e++)this.MenuItems[e].Selected=!1;this._activeItem=1e3-1e3%this.MenuItems.length,this._maxItem=this.MaxItemsOnScreen,this._minItem=0}Clear(){this.MenuItems=[],this.RecalculateDescriptionPosition()}Open(){R.PlaySound(this.AUDIO_BACK,this.AUDIO_LIBRARY),this.Visible=!0}Close(){R.PlaySound(this.AUDIO_BACK,this.AUDIO_LIBRARY),this.Visible=!1,this.onMenuClose.emit()}GoLeft(){if(this.MenuItems[this.CurrentSelection]instanceof M||this.MenuItems[this.CurrentSelection]instanceof O)if(this.MenuItems[this.CurrentSelection]instanceof M){const e=this.MenuItems[this.CurrentSelection];if(0==e.Collection.length)return;e.Index--,R.PlaySound(this.AUDIO_LEFTRIGHT,this.AUDIO_LIBRARY),this.onListChange.emit(e,e.Index)}else if(this.MenuItems[this.CurrentSelection]instanceof O){const e=this.MenuItems[this.CurrentSelection];e.Index=e.Index-1,R.PlaySound(this.AUDIO_LEFTRIGHT,this.AUDIO_LIBRARY),this.onSliderChange.emit(e,e.Index,e.IndexToItem(e.Index))}}GoRight(){if(this.MenuItems[this.CurrentSelection]instanceof M||this.MenuItems[this.CurrentSelection]instanceof O)if(this.MenuItems[this.CurrentSelection]instanceof M){const e=this.MenuItems[this.CurrentSelection];if(0==e.Collection.length)return;e.Index++,R.PlaySound(this.AUDIO_LEFTRIGHT,this.AUDIO_LIBRARY),this.onListChange.emit(e,e.Index)}else if(this.MenuItems[this.CurrentSelection]instanceof O){const e=this.MenuItems[this.CurrentSelection];e.Index++,R.PlaySound(this.AUDIO_LEFTRIGHT,this.AUDIO_LIBRARY),this.onSliderChange.emit(e,e.Index,e.IndexToItem(e.Index))}}SelectItem(){if(!this.MenuItems[this.CurrentSelection].Enabled)return void R.PlaySound(this.AUDIO_ERROR,this.AUDIO_LIBRARY);const e=this.MenuItems[this.CurrentSelection];if(this.MenuItems[this.CurrentSelection]instanceof w)e.Checked=!e.Checked,R.PlaySound(this.AUDIO_SELECT,this.AUDIO_LIBRARY),this.onCheckboxChange.emit(e,e.Checked);else if(R.PlaySound(this.AUDIO_SELECT,this.AUDIO_LIBRARY),this.onItemSelect.emit(e,this.CurrentSelection),this.Children.has(e)){const t=this.Children.get(e);this.Visible=!1,t.Visible=!0,this.onMenuChange.emit(t,!0)}e.fireEvent()}getMousePosition(e=!1){const t=mp.game.resolution.width,s=mp.game.resolution.height,i=mp.gui.cursor.position;let[n,h]=[i[0],i[1]];return e&&([n,h]=[i[0]/t,i[1]/s]),[n,h]}GetScreenResolutionMantainRatio(){const e=mp.game.resolution.width,t=mp.game.resolution.height;return new m(1080*(e/t),1080)}IsMouseInBounds(e,t){const[s,i]=this.getMousePosition();this.GetScreenResolutionMantainRatio();return s>=e.X&&s<=e.X+t.Width&&i>e.Y&&i<e.Y+t.Height}IsMouseInListItemArrows(e,t,s){mp.game.invoke("0x54ce8ac98e120cab".toUpperCase(),"jamyfafi"),mp.game.ui.addTextComponentSubstringPlayerName(e.Text);var i=this.GetScreenResolutionMantainRatio();var n=1080*(i.Width/i.Height);const h=5+mp.game.invoke("0x85f061da64ed2f67".toUpperCase(),0)*n*.35+10,o=431-h;return this.IsMouseInBounds(t,new m(h,38))?1:this.IsMouseInBounds(new u(t.X+h,t.Y),new m(o,38))?2:0}ProcessMouse(){if(!this.Visible||this._justOpened||0==this.MenuItems.length||!this.MouseControlsEnabled)return void this.MenuItems.filter(e=>e.Hovered).forEach(e=>e.Hovered=!1);mp.gui.cursor.visible||(mp.gui.cursor.visible=!0);let e=this.MenuItems.length-1,t=0;this.MenuItems.length>this.MaxItemsOnScreen+1&&(e=this._maxItem),this.IsMouseInBounds(new u(0,0),new m(30,1080))&&this.MouseEdgeEnabled?(mp.game.cam.setGameplayCamRelativeHeading(mp.game.cam.getGameplayCamRelativeHeading()+5),mp.game.ui.setCursorSprite(6)):this.IsMouseInBounds(new u(this.GetScreenResolutionMantainRatio().Width-30,0),new m(30,1080))&&this.MouseEdgeEnabled?(mp.game.cam.setGameplayCamRelativeHeading(mp.game.cam.getGameplayCamRelativeHeading()-5),mp.game.ui.setCursorSprite(7)):this.MouseEdgeEnabled&&mp.game.ui.setCursorSprite(1);for(let i=this._minItem;i<=e;i++){let e=this.offset.X,n=this.offset.Y+144-37+this.extraOffset+38*t,h=431+this.WidthOffset;const o=38,r=this.MenuItems[i];if(this.IsMouseInBounds(new u(e,n),new m(h,o))){if(r.Hovered=!0,mp.game.controls.isControlJustPressed(0,24)||mp.game.controls.isDisabledControlJustPressed(0,24))if(r.Selected&&r.Enabled)if(this.MenuItems[i]instanceof M&&this.IsMouseInListItemArrows(this.MenuItems[i],new u(e,n),0)>0){switch(this.IsMouseInListItemArrows(this.MenuItems[i],new u(e,n),0)){case 1:R.PlaySound(this.AUDIO_SELECT,this.AUDIO_LIBRARY),this.MenuItems[i].fireEvent(),this.onItemSelect.emit(this.MenuItems[i],i);break;case 2:var s=this.MenuItems[i];(null==s.Collection?s.Items.Count:s.Collection.Count)>0&&(s.Index++,R.PlaySound(this.AUDIO_LEFTRIGHT,this.AUDIO_LIBRARY),this.onListChange.emit(s,s.Index))}}else this.SelectItem();else r.Selected?!r.Enabled&&r.Selected&&R.PlaySound(this.AUDIO_ERROR,this.AUDIO_LIBRARY):(this.CurrentSelection=i,R.PlaySound(this.AUDIO_UPDOWN,this.AUDIO_LIBRARY),this.onIndexChange.emit(this.CurrentSelection),this.SelectItem())}else r.Hovered=!1;t++}const i=144+38*(this.MaxItemsOnScreen+1)+this.offset.Y-37+this.extraOffset+this.safezoneOffset.Y,n=this.safezoneOffset.X+this.offset.X;this.MenuItems.length<=this.MaxItemsOnScreen+1||(this.IsMouseInBounds(new u(n,i),new m(431+this.WidthOffset,18))?(this._extraRectangleUp.color=new a(30,30,30,255),(mp.game.controls.isControlJustPressed(0,24)||mp.game.controls.isDisabledControlJustPressed(0,24))&&(this.MenuItems.length>this.MaxItemsOnScreen+1?this.GoUpOverflow():this.GoUp())):this._extraRectangleUp.color=new a(0,0,0,200),this.IsMouseInBounds(new u(n,i+18),new m(431+this.WidthOffset,18))?(this._extraRectangleDown.color=new a(30,30,30,255),(mp.game.controls.isControlJustPressed(0,24)||mp.game.controls.isDisabledControlJustPressed(0,24))&&(this.MenuItems.length>this.MaxItemsOnScreen+1?this.GoDownOverflow():this.GoDown())):this._extraRectangleDown.color=new a(0,0,0,200))}ProcessControl(){this.Visible&&(this._justOpened?this._justOpened=!1:(mp.game.controls.isControlJustReleased(0,177)&&this.GoBack(),0!=this.MenuItems.length&&(mp.game.controls.isControlPressed(0,172)&&this.lastUpDownNavigation+120<Date.now()?(this.lastUpDownNavigation=Date.now(),this.MenuItems.length>this.MaxItemsOnScreen+1?this.GoUpOverflow():this.GoUp()):mp.game.controls.isControlJustReleased(0,172)?this.lastUpDownNavigation=0:mp.game.controls.isControlPressed(0,173)&&this.lastUpDownNavigation+120<Date.now()?(this.lastUpDownNavigation=Date.now(),this.MenuItems.length>this.MaxItemsOnScreen+1?this.GoDownOverflow():this.GoDown()):mp.game.controls.isControlJustReleased(0,173)?this.lastUpDownNavigation=0:mp.game.controls.isControlPressed(0,174)&&this.lastLeftRightNavigation+100<Date.now()?(this.lastLeftRightNavigation=Date.now(),this.GoLeft()):mp.game.controls.isControlJustReleased(0,174)?this.lastLeftRightNavigation=0:mp.game.controls.isControlPressed(0,175)&&this.lastLeftRightNavigation+100<Date.now()?(this.lastLeftRightNavigation=Date.now(),this.GoRight()):mp.game.controls.isControlJustReleased(0,175)?this.lastLeftRightNavigation=0:mp.game.controls.isControlJustPressed(0,201)&&this.SelectItem())))}FormatDescription(e){const t=425+this.WidthOffset;let s=0,i="";const n=e.split(" ");for(const e of n){const n=C.MeasureString(e);(s+=n)>t?(i+="\n"+e+" ",s=n+C.MeasureString(" ")):(i+=e+" ",s+=C.MeasureString(" "))}return i}GoUpOverflow(){this.MenuItems.length<=this.MaxItemsOnScreen+1||(this._activeItem%this.MenuItems.length<=this._minItem?this._activeItem%this.MenuItems.length==0?(this._minItem=this.MenuItems.length-this.MaxItemsOnScreen-1,this._maxItem=this.MenuItems.length-1,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!1,this._activeItem=1e3-1e3%this.MenuItems.length,this._activeItem+=this.MenuItems.length-1,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!0):(this._minItem--,this._maxItem--,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!1,this._activeItem--,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!0):(this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!1,this._activeItem--,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!0),R.PlaySound(this.AUDIO_UPDOWN,this.AUDIO_LIBRARY),this.onIndexChange.emit(this.CurrentSelection))}GoUp(){this.MenuItems.length>this.MaxItemsOnScreen+1||(this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!1,this._activeItem--,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!0,R.PlaySound(this.AUDIO_UPDOWN,this.AUDIO_LIBRARY),this.onIndexChange.emit(this.CurrentSelection))}GoDownOverflow(){this.MenuItems.length<=this.MaxItemsOnScreen+1||(this._activeItem%this.MenuItems.length>=this._maxItem?this._activeItem%this.MenuItems.length==this.MenuItems.length-1?(this._minItem=0,this._maxItem=this.MaxItemsOnScreen,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!1,this._activeItem=1e3-1e3%this.MenuItems.length,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!0):(this._minItem++,this._maxItem++,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!1,this._activeItem++,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!0):(this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!1,this._activeItem++,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!0),R.PlaySound(this.AUDIO_UPDOWN,this.AUDIO_LIBRARY),this.onIndexChange.emit(this.CurrentSelection))}GoDown(){this.MenuItems.length>this.MaxItemsOnScreen+1||(this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!1,this._activeItem++,this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!0,R.PlaySound(this.AUDIO_UPDOWN,this.AUDIO_LIBRARY),this.onIndexChange.emit(this.CurrentSelection))}GoBack(){R.PlaySound(this.AUDIO_BACK,this.AUDIO_LIBRARY),this.Visible=!1,null!=this.ParentMenu&&(this.ParentMenu.Visible=!0,this.ParentMenu._justOpened=!0,this.onMenuChange.emit(this.ParentMenu,!1)),this.onMenuClose.emit()}BindMenuToItem(e,t){e.ParentMenu=this,e.ParentItem=t,this.Children.set(t,e)}ReleaseMenuFromItem(e){if(!this.Children.has(e))return!1;const t=this.Children.get(e);return t.ParentItem=null,t.ParentMenu=null,this.Children.delete(e),!0}render(){if(this.Visible){if(this._justOpened&&(null==this._logo||this._logo.IsTextureDictionaryLoaded||this._logo.LoadTextureDictionary(),this._background.IsTextureDictionaryLoaded||this._background.LoadTextureDictionary(),this._descriptionRectangle.IsTextureDictionaryLoaded||this._descriptionRectangle.LoadTextureDictionary(),this._upAndDownSprite.IsTextureDictionaryLoaded||this._upAndDownSprite.LoadTextureDictionary()),this._mainMenu.Draw(),this.ProcessMouse(),this.ProcessControl(),this._background.size=this.MenuItems.length>this.MaxItemsOnScreen+1?new m(431+this.WidthOffset,38*(this.MaxItemsOnScreen+1)):new m(431+this.WidthOffset,38*this.MenuItems.length),this._background.Draw(),this.MenuItems[this._activeItem%this.MenuItems.length].Selected=!0,""!==this.MenuItems[this._activeItem%this.MenuItems.length].Description){this.RecalculateDescriptionPosition();let e=this.MenuItems[this._activeItem%this.MenuItems.length].Description;this._descriptionText.caption=e;const t=this._descriptionText.caption.split("\n").length;this._descriptionRectangle.size=new m(431+this.WidthOffset,25*t+15),this._descriptionBar.Draw(),this._descriptionRectangle.Draw(),this._descriptionText.Draw()}if(this.MenuItems.length<=this.MaxItemsOnScreen+1){let e=0;for(const t of this.MenuItems)t.SetVerticalPosition(38*e-37+this.extraOffset),t.Draw(),e++;this._counterText&&this.counterOverride&&(this._counterText.caption=this.counterPretext+this.counterOverride,this._counterText.Draw())}else{let t=0;for(let s=this._minItem;s<=this._maxItem;s++){var e=this.MenuItems[s];e.SetVerticalPosition(38*t-37+this.extraOffset),e.Draw(),t++}if(this._extraRectangleUp.size=new m(431+this.WidthOffset,18),this._extraRectangleDown.size=new m(431+this.WidthOffset,18),this._upAndDownSprite.pos=new u(190+this.offset.X+this.WidthOffset/2,147+37*(this.MaxItemsOnScreen+1)+this.offset.Y-37+this.extraOffset),this._extraRectangleUp.Draw(),this._extraRectangleDown.Draw(),this._upAndDownSprite.Draw(),this._counterText){if(this.counterOverride)this._counterText.caption=this.counterPretext+this.counterOverride;else{const e=this.CurrentSelection+1+" / "+this.MenuItems.length;this._counterText.caption=this.counterPretext+e}this._counterText.Draw()}}this._logo.Draw()}}}exports.Menu=T,exports.UIMenuItem=I,exports.UIMenuListItem=M,exports.UIMenuCheckboxItem=w,exports.UIMenuSliderItem=O,exports.BadgeStyle=h,exports.Point=u,exports.Size=m,exports.Color=a,exports.Font=r,exports.ItemsCollection=S,exports.ListItem=x}]);
}
{
/** TODO: Maybe in the future, need to sync phone in player hand. In client-side for GTA V is difficult.
 * Need a new form to sync for game.
 */
const PLAYER_LOCAL = mp.players.local;
const TYPES_SETTINGS = {
    "BINOCULAR": {
        scaleform: "BINOCULARS",
        camera: {
            name: "DEFAULT_SCRIPTED_FLY_CAMERA",
            timecycle: "SheriffStation",
            maxAngleLarge: 45,
            maxAngleWidth: 15,
            defaultZoom: 30,
            minZoom: 40,
            maxZoom: -5
        },
        disableUI: true,
        freezePosition: false
    },
    "WEAZEL": {
        scaleform: "breaking_news",
        camera: {
            name: "DEFAULT_SCRIPTED_FLY_CAMERA",
            timecycle: "default",
            maxAngleLarge: 45,
            maxAngleWidth: 15,
            defaultZoom: 30,
            minZoom: 40,
            maxZoom: 3
        },
        disableUI: true,
        freezePosition: false
    },
    "TV": {
        camera: {
            name: "DEFAULT_SCRIPTED_FLY_CAMERA",
            timecycle: "default",
            maxAngleLarge: 45,
            maxAngleWidth: 15,
            defaultZoom: 30,
            minZoom: 40,
            maxZoom: 3,
            currentFilter: 0,
            filters: [
                "default",
                "Hint_cam",
                "Multipayer_spectatorCam"
            ]
        },
        disableUI: true,
        freezePosition: false
    },
    "SECURITY": {
        scaleform: "security_camera",
        camera: {
            name: "DEFAULT_SCRIPTED_FLY_CAMERA",
            timecycle: "default",
            maxAngleLarge: 45,
            maxAngleWidth: 15,
            defaultZoom: 30,
            minZoom: 40,
            maxZoom: 20
        },
        disableUI: true,
        freezePosition: true
    },
    "TELESCOPE": {
        scaleform: "OBSERVATORY_SCOPE",
        camera: {
            name: "DEFAULT_SCRIPTED_FLY_CAMERA",
            timecycle: "telescope",
            maxAngleLarge: 45,
            maxAngleWidth: 25,
            defaultZoom: 30,
            minZoom: 40,
            maxZoom: -6
        },
        disableUI: true,
        freezePosition: true
    },
    "PHONE": {
        selfie: false,
        camera: {
            name: "DEFAULT_SCRIPTED_FLY_CAMERA",
            timecycle: "default",
            maxAngleLarge: 45,
            maxAngleWidth: 10,
            defaultZoom: 45,
            minZoom: 50,
            maxZoom: 30,
            offset: new mp.Vector3(0.0, 0.2, 0.5),
            offsetInVehicle: new mp.Vector3(-0.35, 0.4, 0.8),
            object: null,
            phone: false,
            currentFilter: 0,
            filters: [
                'phone_cam',
                'phone_cam1',
                'phone_cam10',
                'phone_cam11',
                'phone_cam12',
                'phone_cam13',
                'phone_cam2',
                'phone_cam3',
                'phone_cam4',
                'phone_cam5',
                'phone_cam6',
                'phone_cam7',
                'phone_cam8',
                'phone_cam9'
            ]
        },
        disableUI: false,
        freezePosition: true,
    },
    "PHOTO": {
        selfie: false,
        camera: {
            name: "DEFAULT_SCRIPTED_FLY_CAMERA",
            timecycle: "phone_cam",
            maxAngleLarge: 45,
            maxAngleWidth: 25,
            defaultZoom: 35,
            minZoom: 40,
            maxZoom: 10,
            offset: new mp.Vector3(0.3, 0.2, 0.5),
            object: null,
            currentFilter: 0,
            filters: [
                'phone_cam',
                'phone_cam1',
                'phone_cam10',
                'phone_cam11',
                'phone_cam12',
                'phone_cam13',
                'phone_cam2',
                'phone_cam3',
                'phone_cam4',
                'phone_cam5',
                'phone_cam6',
                'phone_cam7',
                'phone_cam8',
                'phone_cam9'
            ]
        },
        disableUI: false,
        freezePosition: true,
    }
};
let inDisplay = false;
let SETTINGS = null;
let camItemsCamera;
let camType = "";
let camRotationInitial = null;
let fromPos = null;
let lookAt = null;
let selfieOffset = null; // Offset específico para el modo selfie
mp.game.streaming.requestAnimDict("cellphone@self");
mp.game.streaming.requestAnimDict("cellphone@");
mp.rpc("item_camera:toggle", (type, posJson, lookAtJson) => {
    type = type.toUpperCase();
    if (type === "HELICOPTER") {
        mp.toggleHelicamOn();
        return;
    }
    // get settings according with type and search it in JSON TYPES_SETTINGS, if not found is none so delete current cam
    SETTINGS = (TYPES_SETTINGS[type] || "NONE");
    // only toggle UI if the setting disable it or enable if the camera disable it
    if (SETTINGS.disableUI || !mp.isHudToggled()) {
        mp.toggleHud(!mp.isHudToggled());
    }
    if (SETTINGS !== "NONE") {
        // set cam properties
        if (posJson && lookAtJson) {
            try {
                fromPos = JSON.parse(posJson);
                lookAt = JSON.parse(lookAtJson);
                if (!fromPos.x && !fromPos.y && !fromPos.z && !lookAt.x && !lookAt.y && !lookAt.z) {
                    fromPos = PLAYER_LOCAL.position;
                    lookAt = null;
                }
            }
            catch {
                mp.console.logWarning(`cant parse special camera (type=${type},fromPos=${fromPos},lookAt=${lookAtJson})`);
                fromPos = PLAYER_LOCAL.position;
                lookAt = null;
            }
        }
        else {
            fromPos = PLAYER_LOCAL.position;
            lookAt = null;
        }
        camType = type;
        createCamera();
        mp.game.graphics.setTimecycleModifier(SETTINGS.camera.timecycle);
        mp.game.ui.displayHud(false);
        mp.toggleRadar(false);
        inDisplay = true;
    }
    else {
        inDisplay = false;
        mp.game.cam.renderScriptCams(false, false, 0, false, false);
        mp.game.graphics.setTimecycleModifier("default");
        mp.game.ui.displayHud(true);
        mp.toggleRadar(true);
        PLAYER_LOCAL.freezePosition(false);
        if (mp.cameras.exists(camItemsCamera))
            camItemsCamera.destroy();
        camType = "";
        mp.toggleHelicamOff();
    }
});
mp.events.add("render", () => {
    if (inDisplay) {
        //DISABLES ACTIONS TO PLAYER
        mp.game.controls.disableControlAction(0, 200, true); //DISABLE ESC
        if (SETTINGS.freezePosition) {
            mp.game.controls.disableAllControlActions(0); // INPUTGROUP_MOVE
            mp.game.controls.disableAllControlActions(27); // INPUTGROUP_VEH_MOVE_ALL
            // enable voice, as it's disabled with all those controls
            mp.game.controls.enableControlAction(0, 249, true);
            mp.game.controls.enableControlAction(1, 199, true);
        }
        //CAMERA CURSOR FOLLOWING
        let x = mp.game.controls.getDisabledControlNormal(0, 220);
        let y = mp.game.controls.getDisabledControlNormal(0, 221);
        let rot = camItemsCamera.getRot(2);
        let newZ = rot.z;
        let newX = rot.x;
        if (!SETTINGS.selfie) {
            // only can move rotation when not are in selfie mode
            newZ = rot.z + x * -10 * (0.3);
            if (!lookAt)
                PLAYER_LOCAL.setRotation(camRotationInitial.x, camRotationInitial.y, newZ, 1, true);
            //SIDES TOP AND BOTTOM LIMIT
            if (rot.x + y * -10 * (0.3) <= camRotationInitial.x + SETTINGS.camera.maxAngleWidth && rot.x + y * -10 * (0.3) >= camRotationInitial.x - SETTINGS.camera.maxAngleWidth) {
                newX = rot.x + y * -10 * (0.3);
            }
            camItemsCamera.setRot(newX, rot.y, newZ, 2);
            // if camItemsCamera type is phone but the object is not created, execute this
            if (camType === "PHONE" && !SETTINGS.camera.phone) {
                PLAYER_LOCAL.taskPlayAnim("cellphone@", "cellphone_photo_idle", 4.0, 4.0, -1, 18, 0.0, false, false, false);
                SETTINGS.camera.phone = true;
            }
        }
        else {
            // selfie system (rotation)
            let up = mp.game.controls.isDisabledControlPressed(0, 32); // INPUT_MOVE_UP_ONLY
            let down = mp.game.controls.isDisabledControlPressed(0, 33); // INPUT_MOVE_DOWN_ONLY
            let left = mp.game.controls.isDisabledControlPressed(0, 34); // INPUT_MOVE_LEFT_ONLY
            let right = mp.game.controls.isDisabledControlPressed(0, 35); // INPUT_MOVE_RIGHT_ONLY
            // Usar la variable selfieOffset para los movimientos
            if (up)
                selfieOffset.z = selfieOffset.z + 0.005 >= 0.7 ? 0.7 : selfieOffset.z + 0.005;
            if (down)
                selfieOffset.z = selfieOffset.z - 0.005 <= 0.3 ? 0.3 : selfieOffset.z - 0.005;
            if (left)
                selfieOffset.x = selfieOffset.x + 0.005 >= 0.03 ? 0.03 : selfieOffset.x + 0.005;
            if (right)
                selfieOffset.x = selfieOffset.x - 0.005 <= -0.4 ? -0.4 : selfieOffset.x - 0.005;
            if (up || down || left || right) {
                // update camera position if player press any key
                camItemsCamera.attachToPedBone(PLAYER_LOCAL.handle, 57005, selfieOffset.x, selfieOffset.y, selfieOffset.z, true);
                let camPos = camItemsCamera.getCoord();
                if (SETTINGS.camera.object)
                    SETTINGS.camera.object.slide(camPos.x, camPos.y, camPos.z, 1.0, 1.0, 1.0, false);
            }
        }
        //ZOOM
        let currentZoom = camItemsCamera.getFov();
        if (mp.game.controls.isDisabledControlPressed(0, 241) && currentZoom > SETTINGS.camera.maxZoom) {
            currentZoom--;
        }
        if (mp.game.controls.isDisabledControlPressed(0, 242) && currentZoom < SETTINGS.camera.minZoom) {
            currentZoom++;
        }
        camItemsCamera.setFov(currentZoom);
        //SCALEFORM EFFECT
        if (SETTINGS.scaleform) {
            let scaleform = mp.game.graphics.requestScaleformMovie(SETTINGS.scaleform);
            mp.game.graphics.pushScaleformMovieFunction(scaleform, "SET_CAM_LOGO");
            mp.game.graphics.pushScaleformMovieFunctionParameterInt(0);
            mp.game.graphics.popScaleformMovieFunctionVoid();
            mp.game.graphics.drawScaleformMovieFullscreen(scaleform, 255, 255, 255, 255, true);
        }
        if (SETTINGS.camera.filters) {
            // Filters
            let arrowLeft = mp.game.controls.isDisabledControlJustPressed(3, 174); // INPUT_CELLPHONE_LEFT
            let arrowRight = mp.game.controls.isDisabledControlJustPressed(3, 175); // INPUT_CELLPHONE_RIGHT
            if (arrowLeft || arrowRight) {
                if (arrowLeft)
                    SETTINGS.camera.currentFilter = SETTINGS.camera.currentFilter - 1 < 0 ? SETTINGS.camera.filters.length - 1 : SETTINGS.camera.currentFilter - 1;
                else
                    SETTINGS.camera.currentFilter = SETTINGS.camera.currentFilter + 1 > SETTINGS.camera.filters.length - 1 ? 0 : SETTINGS.camera.currentFilter + 1;
                mp.game.graphics.setTimecycleModifier(SETTINGS.camera.filters[SETTINGS.camera.currentFilter]);
            }
        }
        if (SETTINGS.selfie !== undefined && camType === "PHONE") {
            let toggleSelfie = mp.game.controls.isDisabledControlJustPressed(3, 184); // INPUT_CELLPHONE_CAMERA_SELFIE
            if (toggleSelfie) {
                SETTINGS.selfie = !SETTINGS.selfie;
                if (SETTINGS.selfie) {
                    destroyObjects();
                    PLAYER_LOCAL.taskPlayAnim("cellphone@self", "selfie_in", 4.0, 4.0, -1, 18, 0.0, true, true, true);
                    // Inicializar el offset del selfie con el offset actual
                    let currentOffset = PLAYER_LOCAL.vehicle ? SETTINGS.camera.offsetInVehicle : SETTINGS.camera.offset;
                    selfieOffset = new mp.Vector3(currentOffset.x, currentOffset.y, currentOffset.z);
                    camItemsCamera.attachToPedBone(PLAYER_LOCAL.handle, 57005, selfieOffset.x, selfieOffset.y, selfieOffset.z, true);
                    camItemsCamera.pointAtPedBone(PLAYER_LOCAL.handle, 65068, 0, 0, 0, true);
                    createInvisibleObject();
                }
                else {
                    PLAYER_LOCAL.taskClearLookAt();
                    destroyObjects();
                    PLAYER_LOCAL.clearTasks();
                    if (mp.cameras.exists(camItemsCamera))
                        camItemsCamera.destroy();
                    // Limpiar la variable selfieOffset
                    selfieOffset = null;
                    createCamera();
                }
                mp.events.callRemote("phone:on_toggle_selfie", SETTINGS.selfie);
            }
        }
        //LOAD CAMERA (RENDER)
        mp.game.cam.renderScriptCams(true, false, 0, true, false);
    }
});
function createCamera() {
    camItemsCamera = mp.cameras.new('DEFAULT_SCRIPTED_FLY_CAMERA', fromPos, PLAYER_LOCAL.getRotation(5), SETTINGS.camera.defaultZoom);
    camRotationInitial = PLAYER_LOCAL.getRotation(5);
    if (!lookAt) {
        // Para cámara PHONE, usar offset específico solo si está en vehículo
        if (camType === "PHONE" && PLAYER_LOCAL.vehicle && SETTINGS.camera.offsetInVehicle) {
            camItemsCamera.attachToPedBone(PLAYER_LOCAL.handle, 57005, SETTINGS.camera.offsetInVehicle.x, SETTINGS.camera.offsetInVehicle.y, SETTINGS.camera.offsetInVehicle.z, true);
        }
        else {
            camItemsCamera.attachTo(PLAYER_LOCAL.handle, 0, 0, 1.0, false);
        }
    }
    else {
        camItemsCamera.pointAtCoord(lookAt.x, lookAt.y, lookAt.z);
    }
}
function destroyObjects() {
    if (SETTINGS.camera) {
        SETTINGS.camera.phone = false;
        if (mp.objects.exists(SETTINGS.camera.object)) {
            SETTINGS.camera.object.destroy();
            SETTINGS.camera.object = null;
        }
    }
}
/** This object is used to set task look at for player */
function createInvisibleObject() {
    let camPos = camItemsCamera.getCoord();
    SETTINGS.camera.object = mp.objects.new(mp.game.joaat("new_phone_hub_black"), camPos, {
        rotation: new mp.Vector3(0, 0, 0),
        alpha: 0,
        dimension: -1
    });
    setTimeout(() => {
        // need timeout to create item and player can execute task look at object
        if (SETTINGS.camera && mp.objects.exists(SETTINGS.camera.object)) {
            camPos = camItemsCamera.getCoord();
            SETTINGS.camera.object.slide(camPos.x, camPos.y, camPos.z, 1.0, 1.0, 1.0, false);
            PLAYER_LOCAL.taskLookAt(SETTINGS.camera.object.handle, -1, 0, 0);
        }
    }, 1000);
}
mp.events.add("phone:off_cam", () => {
    if (camType === "PHONE") {
        SETTINGS.selfie = false;
        destroyObjects();
        PLAYER_LOCAL.clearTasks();
        mp.events.call("item_camera:toggle", "NORMAL");
        mp.events.callRemote("phone:on_close_camera");
    }
});

}
{
// rotating variables
let rotatingEntity;
let rotatePosition;
let rotateHeading;
let prevCursorPos;
let rotateSensitivity = 800;
let clickPressed = false;
let res = mp.game.graphics.getScreenActiveResolution(0, 0);
mp.events.add("click", (x, y, upOrDown, leftOrRight, relativeX, relativeY, worldPosition, hitEntity) => {
    if (rotatingEntity && leftOrRight === "left") {
        clickPressed = upOrDown === "down";
        prevCursorPos = [x, y];
    }
});
mp.rpc("entityrotation:set_entity", (kind, id) => {
    rotatingEntity = mp.getEntityForKindAndId(kind, id);
    if (rotatingEntity) {
        rotatePosition = rotatingEntity.position;
    }
});
// change fov of active camera (if any) when scrolling
mp.events.add("entityrotation:on_scroll", (isUp) => {
    if (rotatingEntity && !mp.isMouseOverUi()) {
        let cam = mp.players.local.activeCamera;
        if (cam && (!mp.isUIEnabled("charactercustomization") || !mp.isMouseOverUi())) {
            let add = isUp ? -5.0 : 5.0;
            let min = 25;
            let max = 70;
            let fov = cam.getFov() + add;
            if (fov < min)
                fov = min;
            if (fov > max)
                fov = max;
            cam.setFov(fov);
        }
    }
});
mp.rpc("player:set_angle", (id, angle) => {
    if (rotatingEntity && rotatingEntity.id == id && rotatingEntity.type === "player") {
        rotateHeading = angle;
    }
});
mp.events.add("render", () => {
    // rotating entity
    if (rotatingEntity) {
        try {
            rotatingEntity.type;
        }
        catch (e) {
            // expired multiplayer object has been used
            rotatingEntity = null;
        }
        if (rotatingEntity && !mp.isMouseOverUi()) {
            if (rotatingEntity.type === "vehicle" && rotatingEntity.getDirtLevel() > 0.1) {
                rotatingEntity.setDirtLevel(0);
            }
            if (clickPressed) {
                if (rotateHeading == null) {
                    rotateHeading = rotatingEntity.getHeading();
                }
                let currCursorPos = mp.gui.cursor.position;
                if (prevCursorPos == null) {
                    prevCursorPos = currCursorPos;
                }
                let delta = { x: currCursorPos[0] - prevCursorPos[0], y: currCursorPos[1] - prevCursorPos[1] };
                delta.x /= res.x;
                delta.y /= res.y;
                prevCursorPos = currCursorPos;
                if (Math.abs(delta.x) > 0.0 || Math.abs(delta.y) > 0.0) {
                    rotateHeading = rotateHeading + (delta.x * rotateSensitivity);
                }
            }
            if (rotateHeading != null) {
                try {
                    rotatingEntity.setHeading(rotateHeading);
                    rotatingEntity.setVelocity(0, 0, 0);
                    if (rotatingEntity.type == "vehicle") {
                        let isBike = mp.game.vehicle.isThisModelABike(rotatingEntity.model) ||
                            mp.game.vehicle.isThisModelABicycle(rotatingEntity.model);
                        if (isBike) {
                            rotatingEntity.position = rotatePosition;
                        }
                        rotatingEntity.setDirtLevel(0); // force clean as is used in dealerships
                    }
                }
                catch (e) {
                    // inside try-catch because the rotating entity may be destroyed at any time and this will crash
                }
            }
        }
    }
});

}
ui_entityrotation.js
{
/// <reference path="../node_modules/@ragempcommunity/types-client/index.d.ts" />
// Show roulette and set items
mp.rpc("ui_roulette:show", (title, description, options, winnerIndex) => {
    mp.enableUI("roulette", false, false, true);
    mp.browserCall("rouletteVM", "showRoulette", title, description, JSON.parse(options), winnerIndex);
});
mp.events.add("ui_roulette:hide", () => {
    mp.disableUI("roulette");
    mp.events.callRemote("ui_roulette:hide");
});
mp.events.add("ui_roulette:on_start", () => {
    mp.events.callRemote("ui_roulette:on_start");
});
mp.events.add("ui_roulette:on_finish", () => {
    mp.events.callRemote("ui_roulette:on_finish");
});

}
ui_roulette.js
{
mp.useInput(mp.input.CLOSE, false, () => {
    mp.events.callRemote("dailyreward:close");
});
mp.rpc("dailyreward:show", (data) => {
    mp.browserCall("dailyrewardVM", "showDailyReward", JSON.parse(data));
    mp.enableUI("dailyreward", true, true, true);
});
mp.rpc("dailyreward:hide", () => {
    mp.browserExecute("dailyrewardVM.show=false");
    mp.disableUI("dailyreward");
});
mp.rpc("dailyreward:claim", () => {
    mp.events.callRemote("dailyreward:claim");
});
mp.events.add("dailyreward:buy_plus", () => {
    mp.events.callRemote("dailyreward:buy_plus");
});
mp.events.add("dailyreward:buy_level", () => {
    mp.events.callRemote("dailyreward:buy_level");
});
mp.events.add("dailyreward:claim_old_rewards", () => {
    mp.events.callRemote("dailyreward:claim_old_rewards");
});
mp.events.add("dailyreward:close", () => {
    mp.events.callRemote("dailyreward:close");
});
mp.events.add("dailyreward:on_hover", () => {
    mp.game.audio.playSoundFrontend(2, "CLICK_BACK", "WEB_NAVIGATION_SOUNDS_PHONE", true);
});

}
ui_dailyreward.js
{
mp.rpc("dialogchoices:update", (data) => {
    mp.enableUI("dialogchoices", true, true, true);
    mp.browserCall("dialogchoicesVM", "update", JSON.parse(data));
});
mp.rpc("dialogchoices:hide", () => {
    mp.browserExecute("dialogchoicesVM.show = false");
    mp.disableUI("dialogchoices");
});
mp.rpc("dialogchoices:continue", () => {
    mp.browserExecute("dialogchoicesVM.continueWithChoice()");
});
mp.events.add("dialogchoices:on_cancel", () => {
    mp.events.callRemote("dialogchoices:on_cancel");
});
mp.events.add("dialogchoices:on_submit", (code) => {
    mp.events.callRemote("dialogchoices:on_submit", code);
});
mp.events.add("dialogchoices:trigger_sound", (soundString, dialogLength) => {
    mp.events.callRemote("dialogchoices:trigger_sound", soundString, dialogLength);
});
mp.events.add("dialogchoices:on_select", (code) => {
    mp.events.callRemote("dialogchoices:on_select", code);
});

}
ui_dialogchoices.js
{
const state = {
    isCreating: false,
    isOpen: false,
    isEnabled: false,
    lastToggleTime: 0,
    lastErrorTime: 0,
    errorCount: 0,
    isRecovering: false
};
// Constants
const DEBOUNCE_TIME = 500;
const ERROR_RESET_TIME = 5000;
const MAX_ERRORS = 3;
const RECOVERY_DELAY = 1000;
let iframeview_translations = {};
let iframeBrowser = null;
let url = "";
function resetState() {
    state.isCreating = false;
    state.isOpen = false;
    state.isEnabled = false;
    state.errorCount = 0;
}
function handleError(error) {
    const now = Date.now();
    if (now - state.lastErrorTime > ERROR_RESET_TIME) {
        state.errorCount = 0;
    }
    state.lastErrorTime = now;
    state.errorCount++;
    // mp.console.logError(`IframeView Error: ${error}`);
    if (state.errorCount >= MAX_ERRORS) {
        forceRecovery();
    }
}
async function forceRecovery() {
    if (state.isRecovering)
        return;
    state.isRecovering = true;
    // mp.console.logInfo("IframeView: Starting recovery process");
    try {
        if (iframeBrowser) {
            iframeBrowser.destroy();
            iframeBrowser = null;
        }
        mp.disableUI("iframeview");
        resetState();
        await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY));
    }
    catch (error) {
        // mp.console.logError(`IframeView Recovery Error: ${error}`);
    }
    finally {
        state.isRecovering = false;
    }
}
async function createBrowserIfNotExists(addLoading = false) {
    if (state.isCreating || iframeBrowser || state.isRecovering) {
        return;
    }
    let loadingBrowser = null;
    try {
        state.isCreating = true;
        if (addLoading) {
            loadingBrowser = await mp.browsers.retryNew("package://html/loading.html");
            loadingBrowser.active = true;
        }
        iframeBrowser = await mp.browsers.retryNew(url);
        if (addLoading && loadingBrowser) {
            loadingBrowser.destroy();
            loadingBrowser = null;
        }
        if (iframeBrowser) {
            iframeBrowser.active = false;
            iframeBrowser.execute("window.localStorage.setItem('isCEF', true)");
        }
    }
    catch (error) {
        handleError(error);
    }
    finally {
        loadingBrowser?.destroy();
        state.isCreating = false;
    }
}
function destroyBrowserIfExists() {
    if (iframeBrowser) {
        try {
            iframeBrowser.destroy();
        }
        catch (error) {
            handleError(error);
        }
        finally {
            iframeBrowser = null;
        }
    }
}
function enableBrowser() {
    if (!iframeBrowser || state.isRecovering)
        return;
    try {
        state.isOpen = true;
        state.isEnabled = true;
        iframeBrowser.active = true;
        mp.enableUI("iframeview", false, true, true);
    }
    catch (error) {
        handleError(error);
        disableBrowser();
    }
}
function disableBrowser() {
    if (state.isRecovering)
        return;
    state.isOpen = false;
    state.isEnabled = false;
    if (!iframeBrowser)
        return;
    try {
        iframeBrowser.active = false;
        mp.disableUI("iframeview");
    }
    catch (error) {
        handleError(error);
    }
}
function toggleViewCursorMode() {
    const now = Date.now();
    if (now - state.lastToggleTime < DEBOUNCE_TIME || state.isRecovering) {
        return;
    }
    state.lastToggleTime = now;
    if (!mp.isAnyUIEnabled()) {
        createBrowserIfNotExists(true).finally(() => {
            if (!state.isRecovering) {
                enableBrowser();
            }
        });
    }
    else if (mp.isUIEnabled("iframeview")) {
        disableBrowser();
    }
}
function toggleViewNonCursorMode() {
    if (!iframeBrowser || state.isRecovering)
        return;
    const now = Date.now();
    if (now - state.lastToggleTime < DEBOUNCE_TIME) {
        return;
    }
    state.lastToggleTime = now;
    try {
        if (!mp.isAnyUIEnabled() && !iframeBrowser.active) {
            iframeBrowser.active = true;
        }
        else if (!mp.isAnyUIEnabled() && iframeBrowser.active) {
            iframeBrowser.active = false;
        }
    }
    catch (error) {
        handleError(error);
    }
}
mp.rpc("player:set_server_language", (lang) => {
    iframeview_translations = mp.getTranslations(['getSupport'], lang);
});
mp.useInput(mp.input.TOGGLE_CURSOR, true, () => {
    toggleViewCursorMode();
});
// toggle visibility on/off but without locking cursor
mp.useInput(mp.input.TOGGLE_UI_FRAME, true, () => {
    if (!mp.keys.isDown(0xA4 /*left alt*/))
        return;
    if (mp.keys.isDown(0xA0 /*left shift*/)) { // non-cursor mode
        toggleViewNonCursorMode();
    }
    else {
        toggleViewCursorMode();
    }
});
mp.rpc("iframeview:close", () => {
    disableBrowser();
});
// disable C while holding alt to avoid the looking back instant
mp.events.add("render", () => {
    if (mp.keys.isDown(0xA4 /*left alt*/)) {
        mp.game.controls.disableControlAction(0, 26, true); // INPUT_LOOK_BEHIND
    }
});
mp.rpc("iframeview:open", () => {
    if (state.isRecovering)
        return;
    if (url === "") {
        try {
            mp.browserCall("chatVM", "addMessage", `${iframeview_translations['getSupport']}`);
        }
        catch (error) {
            handleError(error);
        }
    }
    else {
        createBrowserIfNotExists(true).finally(() => {
            if (!state.isRecovering) {
                enableBrowser();
            }
        });
    }
});
mp.rpc("iframeview:url", (urlDataJSON) => {
    if (state.isRecovering)
        return;
    try {
        const urlData = JSON.parse(urlDataJSON);
        if (urlData.url === "") { // destroy browser
            destroyBrowserIfExists();
        }
        else {
            url = urlData.url;
        }
    }
    catch (error) {
        handleError(error);
    }
});

}
ui_iframeview.js
{
mp.rpc("shop:show", (accountData, subscriptionData, rewardsData, subscriptionPackOffer, boostPackOffer, packOffersFeatureFlag) => {
    mp.enableUI("shop", true, true, true);
    mp.browserCall("shopVM", "update", JSON.parse(accountData), JSON.parse(subscriptionData), JSON.parse(rewardsData), JSON.parse(subscriptionPackOffer), JSON.parse(boostPackOffer), packOffersFeatureFlag);
});
mp.rpc("shop:confirmation", (title, confirmationText) => {
    if (!mp.isUIEnabled("shop"))
        return;
    mp.browserCall("shopVM", "askConfirmation", title, confirmationText);
});
mp.rpc("shop:hide", () => {
    mp.browserSet("shopVM", "show", false);
    mp.disableUI("shop");
});
mp.rpc("shop:close", () => {
    mp.events.callRemote("shop:close");
});

}
ui_shop.js
{
mp.rpc("ui_referrals:show", (data) => {
    mp.enableUI("referral", true, true, true);
    mp.browserCall("referVM", "update", JSON.parse(data));
});
// from server-side
mp.rpc("ui_referrals:close", () => {
    mp.browserSet("referVM", "show", false);
    mp.disableUI("referral");
});
// from client-side html
mp.rpc("ui_referrals:hide", () => {
    mp.events.callRemote("ui_referrals:hide");
});

}
ui_referrals.js
{
let isVideoShown = false;
mp.rpc("videoiframe:show", (videoID) => {
    mp.browserCall("videoIframeVM", "showVideo", videoID);
    mp.enableUI("videoiframe", true, true, false, false);
    isVideoShown = true;
});
mp.rpc("videoiframe:hide", () => {
    isVideoShown = false;
    mp.browserCall("videoIframeVM", "hide");
    mp.disableUI("videoiframe");
});
mp.events.add("render", () => {
    if (isVideoShown) { // disable esc
        mp.game.controls.disableControlAction(13, 200, true);
    }
});

}
ui_videoiframe.js
{
mp.rpc("changelog:show", (changelogData) => {
    console.log("Showing changelog");
    mp.enableUI("changelog", true, true, true);
    mp.browserCall("changelogVM", "update", changelogData);
});
mp.rpc("changelog:hide", () => {
    console.log("Hiding changelog");
    mp.browserCall("changelogVM", "hide");
    mp.disableUI("changelog");
});
mp.rpc("changelog:on_close", () => {
    mp.events.callRemote("changelog:on_close");
});

}
ui_changelog.js
{
/// <reference path="../node_modules/@ragempcommunity/types-client/index.d.ts" />
mp.rpc("keyboardconfig:show", (config, layout) => {
    mp.enableUI("keyboardconfig", true, true, true);
    if (config.length > 0) {
        // Parse user config, and set values to hex
        config = JSON.parse(config);
        config.forEach((key) => {
            key.key = "0x" + key.key.toString(16).toUpperCase().padStart(2, '0');
        });
        mp.browserSet("keyboardconfigVM", "config", config);
    }
    if (layout === "") {
        layout = "QWERTY";
    }
    mp.browserSet("keyboardconfigVM", "selectedLayout", layout);
    mp.browserCall("keyboardconfigVM", "loadLayoutsAndKeys");
    mp.browserCall("keyboardconfigVM", "toggle", true);
    if (mp.isUIEnabled("menu"))
        mp.browserSet("keyboardconfigVM", "blackscreen", true);
});
mp.events.add("keyboardconfig:hide", () => {
    mp.browserCall("keyboardconfigVM", "toggle", false);
    setTimeout(() => {
        if (!mp.isUIEnabled("keyboardconfig"))
            mp.browserSet("keyboardconfigVM", "blackscreen", false);
    }, 50);
    mp.disableUI("keyboardconfig");
});
mp.rpc("keyboardconfig:saveKeys", (keys, layout) => {
    mp.events.callRemote("keyboardconfig:on_save", keys, layout);
    setTimeout(() => {
        mp.setKeybinds(keys);
    }, 50);
});
mp.useInput(mp.input.CLOSE, false, () => {
    mp.events.callRemote("keyboardconfig:hide");
});

}
ui_keyboardconfig.js
{
mp.rpc("characterselection:show", (show, userId, characterData, newCharacterInfo, slots) => {
    if (show) {
        mp.enableUI("characterselection", true, true, true);
        const charactersDataParsed = JSON.parse(characterData);
        mp.browserSet("characterSelectionVM", "show", show);
        mp.browserSet("characterSelectionVM", "userId", userId);
        mp.browserCall("characterSelectionVM", "setSlots", slots);
        mp.browserSet("characterSelectionVM", "characters", charactersDataParsed);
        mp.browserSet("characterSelectionVM", "newCharacterInfo", newCharacterInfo);
    }
    else {
        mp.disableUI("characterselection");
        mp.browserSet("characterSelectionVM", "show", show);
    }
});

}
ui_characterselection.js
{
const bypassUi = ["phone"];
const SCREEN_POSITION_TOLERANCE = 0.02;
const SCREEN_POSITION_TOLERANCE_SQUARED = SCREEN_POSITION_TOLERANCE * SCREEN_POSITION_TOLERANCE;
const SCREEN_CENTER = { x: 0.5, y: 0.5 };
const SCREEN_CENTER_TOLERANCE = 0.1;
let interactions = [];
let selectedInteractions = [];
mp.rpc('player:set_interactions', (interactionsString) => {
    const parsedInteractions = JSON.parse(interactionsString);
    interactions = parsedInteractions.map(interaction => {
        const newInteraction = { ...interaction };
        if (interaction.attachmentData && interaction.attachmentData !== "{}") {
            const otherEntity = mp.getEntityForKindAndId(interaction.attachmentData.type, interaction.attachmentData.id);
            if (otherEntity) {
                newInteraction.attachedTo = otherEntity;
            }
        }
        return newInteraction;
    });
});
mp.events.add('player:on_input', (input, pressed) => {
    const interaction = selectedInteractions.find(i => i.input == input);
    if (pressed && interaction != null) {
        mp.events.callRemote('player:on_interact', JSON.stringify(interaction.ids));
    }
});
mp.events.add("render", () => {
    if ((mp.isAnyUIEnabled() && !bypassUi.includes(mp.getTopUI())) || interactions.length === 0 || !mp.isHudToggled()) {
        selectedInteractions = [];
        return mp.browserCall("interactionVM", "hideInteractions");
    }
    const playerPosition = mp.players.local.position;
    const groupedItems = {};
    const inputGroups = {};
    const screenPositions = new Map();
    for (const item of interactions) {
        const pos = item.attachedTo && item.attachedTo.handle
            ? item.attachedTo.getCoords(true)
            : item.position;
        const screenPos = mp.game.graphics.world3dToScreen2d(pos.x, pos.y, pos.z);
        if (!screenPos)
            continue;
        screenPositions.set(item, { x: screenPos.x, y: screenPos.y });
    }
    for (const [item, screenPos] of screenPositions) {
        let foundGroup = false;
        for (const key in groupedItems) {
            const [x, y] = key.split(',').map(n => parseInt(n) / 1000);
            const dx = x - screenPos.x;
            const dy = y - screenPos.y;
            if (dx * dx + dy * dy <= SCREEN_POSITION_TOLERANCE_SQUARED) {
                groupedItems[key].push({ ...item, position: new mp.Vector3(screenPos.x, screenPos.y, 0) });
                foundGroup = true;
                break;
            }
        }
        if (!foundGroup) {
            const posKey = `${(screenPos.x * 1000) | 0},${(screenPos.y * 1000) | 0}`;
            groupedItems[posKey] = [{ ...item, position: new mp.Vector3(screenPos.x, screenPos.y, 0) }];
        }
    }
    for (const posKey in groupedItems) {
        const items = groupedItems[posKey];
        for (const item of items) {
            if (!inputGroups[item.input])
                inputGroups[item.input] = {};
            if (!inputGroups[item.input][posKey])
                inputGroups[item.input][posKey] = [];
            inputGroups[item.input][posKey].push(item);
        }
    }
    selectedInteractions = [];
    for (const inputKey in inputGroups) {
        const inputGroup = inputGroups[inputKey];
        const positions = Object.keys(inputGroup);
        let closestToCenter = null;
        let closestToCenterDist = Infinity;
        let closestToCenterPosKey = null;
        for (const posKey of positions) {
            const item = inputGroup[posKey][0];
            const screenPos = item.position;
            const dx = screenPos.x - SCREEN_CENTER.x;
            const dy = screenPos.y - SCREEN_CENTER.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestToCenterDist) {
                closestToCenterDist = dist;
                closestToCenter = item;
                closestToCenterPosKey = posKey;
            }
        }
        if (closestToCenter && closestToCenterDist <= SCREEN_CENTER_TOLERANCE) {
            const items = inputGroup[closestToCenterPosKey];
            for (const item of items) {
                item.interactuable = true;
                selectedInteractions.push(item);
            }
            for (const posKey of positions) {
                if (posKey === closestToCenterPosKey)
                    continue;
                for (const item of inputGroup[posKey]) {
                    item.interactuable = false;
                }
            }
        }
        else {
            if (positions.length > 1) {
                let closestDist = Infinity;
                let closestPos = null;
                for (const posKey of positions) {
                    const pos = inputGroup[posKey][0].position;
                    const dx = playerPosition.x - pos.x;
                    const dy = playerPosition.y - pos.y;
                    const dz = playerPosition.z - pos.z;
                    const dist = dx * dx + dy * dy + dz * dz;
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPos = posKey;
                    }
                }
                for (const posKey of positions) {
                    const items = inputGroup[posKey];
                    const isInteractuable = posKey === closestPos;
                    for (const item of items) {
                        item.interactuable = isInteractuable;
                        if (isInteractuable)
                            selectedInteractions.push(item);
                    }
                }
            }
            else {
                const items = inputGroup[positions[0]];
                for (const item of items) {
                    item.interactuable = true;
                    selectedInteractions.push(item);
                }
            }
        }
    }
    mp.browserCall("interactionVM", "showInteractions", Object.values(groupedItems));
});

}
interactions.js
{
function close() {
    mp.disableUI("livemap");
    mp.browserCall("livemapVM", "toggleShow", false);
}
mp.rpc("livemap:open", (mapData) => {
    mp.enableUI("livemap", false, false, true);
    mp.browserCall("livemapVM", "setMapData", JSON.parse(mapData));
    mp.browserCall("livemapVM", "toggleShow", true);
});
mp.rpc("livemap:close", () => {
    close();
});
mp.rpc("livemap:marker_data", (markerData) => {
    mp.browserCall("livemapVM", "setMarkerData", JSON.parse(markerData));
});
mp.events.add("livemap:close", () => {
    close();
    mp.events.callRemote("livemap:close");
});

}
ui_livemap.js
{
let pedHeadShot = 0;
let screenResolution = { x: 0, y: 0 };
let takingScreenshot = false;
let headshotTexture = "";
let frameCount = 0;
let timeoutHeadshot = 0;
let enableBadgeCustomImage = false;
let useBrowser = false;
let browserHeadshot = null;
let browserActive = false;
let badgeData = {
    name: "",
    gender: true,
    id: "",
    hash: "",
    playerImageB64: {
        url: "",
        screenResolution: {}
    },
    factionName: "",
    factionColor: "",
    rank: "",
    badgeImageUrl: "",
    scale: 1
};
mp.rpc("badge:useCustomImage", (useCustomImage) => {
    enableBadgeCustomImage = useCustomImage;
});
mp.rpc("badge:useBrowser", (enabledBrowser) => {
    useBrowser = enabledBrowser;
});
mp.rpc("badge:create", (badgeDataJSON) => {
    if (takingScreenshot || browserActive)
        return;
    try {
        mp.browserCall("badgeVM", "toggle", true);
        badgeData = JSON.parse(badgeDataJSON);
        mp.enableUI("badge", true, false, true);
        if (!enableBadgeCustomImage) {
            badgeUseDefaultImage("Config");
        }
        else {
            if (useBrowser) {
                handlePictureTake();
            }
            else {
                prepareScreenshot();
            }
        }
    }
    catch (e) {
        mp.console.logError(`Error parsing badge data: ${e}`, true);
    }
});
function render() {
    if (!takingScreenshot)
        return;
    if (!checkHeadshotReady())
        return;
    try {
        if (checkHeadshotReady()) {
            mp.game.graphics.drawSprite(headshotTexture, headshotTexture, 0.977, 0.955, 0.05, 0.09, 0.0, 255, 255, 255, 255, true);
            if (frameCount === 1) {
                mp.gui.takeScreenshot(`player_headshot.jpg`, 0, 0, 0);
                takingScreenshot = false;
                playerheadshotTaken();
            }
        }
    }
    catch (e) {
        mp.console.logError(`Render error: ${e}`, true);
        cleanupResources();
    }
    frameCount++;
}
function renderBrowser() {
    if (!browserActive)
        return;
    if (!checkHeadshotReady())
        return;
    try {
        if (checkHeadshotReady()) {
            mp.game.graphics.drawSprite(headshotTexture, headshotTexture, 0.977, 0.955, 0.05, 0.09, 0.0, 255, 255, 255, 255, true);
            if (frameCount === 1) {
                createBrowser();
            }
        }
    }
    catch (e) {
        mp.console.logError(`Render error: ${e}`, true);
        cleanupResources();
    }
    frameCount++;
}
async function prepareScreenshot() {
    mp.game.waitAsync(500);
    try {
        let playerId = badgeData.id ? parseInt(badgeData.id) : null;
        if (playerId === null || isNaN(playerId)) {
            cleanupResources();
            return;
        }
        const targetPlayer = mp.players.atRemoteId(playerId);
        if (!targetPlayer || !mp.players.exists(targetPlayer)) {
            cleanupResources();
            return;
        }
        pedHeadShot = mp.game.ped.registerHeadshot(targetPlayer.handle);
        screenResolution = mp.game.graphics.getScreenActiveResolution(0, 0);
        await mp.game.waitForAsync(() => mp.game.ped.isPedheadshotValid(pedHeadShot) && mp.game.ped.isPedheadshotReady(pedHeadShot), 10000);
        getTextureHeadshot();
    }
    catch (e) {
        mp.console.logError(`Error in prepareScreenshot: ${e}`, true);
        cleanupResources();
    }
}
function getTextureHeadshot() {
    try {
        if (checkHeadshotReady()) {
            if (pedHeadShot <= 0) {
                cleanupResources();
                return;
            }
            headshotTexture = mp.game.ped.getPedheadshotTxdString(pedHeadShot);
            takingScreenshot = true;
            frameCount = 0;
            mp.events.add('render', render);
        }
        else {
            mp.console.logWarning("Headshot not ready", true);
            cleanupResources();
        }
    }
    catch (e) {
        mp.console.logError(`Error in checkHeadshotReady: ${e}`, true);
        cleanupResources();
    }
}
function checkHeadshotReady() {
    try {
        if (mp.game.ped.isPedheadshotValid(pedHeadShot) && mp.game.ped.isPedheadshotReady(pedHeadShot)) {
            return true;
        }
        else {
            badgeUseDefaultImage("Headshot not ready");
            return false;
        }
    }
    catch (e) {
        mp.console.logError(`Error in checkHeadshot: ${e}`, true);
        badgeUseDefaultImage("Error in checkHeadshot: " + e);
        return false;
    }
}
function playerheadshotTaken() {
    badgeData.playerImageB64.url = "http://screenshots/player_headshot.jpg";
    badgeData.playerImageB64.screenResolution = screenResolution;
    mp.browserCall("badgeVM", "setBadgeData", badgeData);
    cleanupResources();
}
function badgeUseDefaultImage(reason = "") {
    mp.console.logWarning("[Ped Headshot Screenshot] reason:" + reason, true);
    badgeData.playerImageB64.url = "";
    mp.browserCall("badgeVM", "setBadgeData", badgeData);
    cleanupResources();
}
function playerheadshotTakenBrowser(base64) {
    badgeData.playerImageB64.url = base64;
    mp.browserCall("badgeVM", "setBadgeDataBase64", badgeData);
    cleanupResources();
}
function cleanupResources() {
    try {
        if (pedHeadShot && mp.game.ped.isPedheadshotValid(pedHeadShot)) {
            mp.game.ped.unregisterHeadshot(pedHeadShot);
        }
    }
    catch (e) {
        mp.console.logError(`Cleanup error: ${e}`, true);
    }
    finally {
        pedHeadShot = 0;
        takingScreenshot = false;
        frameCount = 0;
        headshotTexture = "";
        timeoutHeadshot = 0;
        if (useBrowser) {
            mp.events.remove("render", renderBrowser);
        }
        else {
            mp.events.remove("render", render);
        }
    }
}
async function handlePictureTake() {
    mp.game.waitAsync(500);
    let playerId = badgeData.id ? parseInt(badgeData.id) : null;
    if (playerId === null || isNaN(playerId)) {
        cleanupResources();
        badgeUseDefaultImage("Error on Player ID, playerId: " + playerId);
        return;
    }
    const targetPlayer = mp.players.atRemoteId(playerId);
    if (!targetPlayer || !mp.players.exists(targetPlayer)) {
        cleanupResources();
        badgeUseDefaultImage("Error on target player, playerId: " + playerId);
        return;
    }
    pedHeadShot = mp.game.ped.registerHeadshot(targetPlayer.handle);
    screenResolution = mp.game.graphics.getScreenActiveResolution(0, 0);
    await mp.game.waitForAsync(() => mp.game.ped.isPedheadshotValid(pedHeadShot) && mp.game.ped.isPedheadshotReady(pedHeadShot), 10000);
    if (!mp.game.ped.isPedheadshotValid(pedHeadShot) || !mp.game.ped.isPedheadshotReady(pedHeadShot)) {
        mp.console.logError("[handlePictureTake] Ped headshot is not valid or ready.");
        badgeUseDefaultImage("Error on Ped headshot, is not valid or ready.");
        return;
    }
    headshotTexture = mp.game.ped.getPedheadshotTxdString(pedHeadShot);
    frameCount = 0;
    browserActive = true;
    mp.events.add("render", renderBrowser);
}
function createBrowser() {
    browserHeadshot = mp.browsers.new("http://package/html/badge.html");
    browserHeadshot.onDomReady = onBrowserDomReady;
}
function onBrowserDomReady() {
    if (browserHeadshot && mp.browsers.exists(browserHeadshot)) {
        browserHeadshot.call("badge:cropImage", "http://screenshots/take", screenResolution);
        browserActive = false;
    }
}
mp.events.add("badge:base64", (base64) => {
    playerheadshotTakenBrowser(base64);
    browserHeadshot?.destroy();
    browserHeadshot = null;
});
mp.rpc("badge:destroyClean", () => {
    mp.disableUI("badge");
    mp.browserCall("badgeVM", "toggle", false);
    cleanupResources();
});

}
ui_badge.js
{
// I tried to use a JSON, but it didn't work, so I put the translations here.
// Also tried to send the language from langhandler, but it didn't work either.
// Due to limitations XHR/fetch requests are not working, when localization.js is loaded.
// tried to wait when browserDomReady event is fired, but it didn't work either.
// when I found a better way to do it, I will update this file.
const dataLocalization = {
    "es": {
        "brakeEmergencyNotification": "~w~Freno de emergencia activado",
        "enabledCruiseControl": "~w~Velocidad crucero activada a ~b~",
        "cruiseControlAugmented": "~w~Velocidad crucero aumentada ~b~+5",
        "cruiseControlReduced": "~w~Velocidad crucero reducida ~b~-5",
        "speedUnit": "km/h",
        "rechargedVoice": "~w~Voz recargada",
        "talkModes": [
            {
                icon: "low",
                name: "susurro",
                color: "c"
            },
            {
                icon: "shout",
                name: "gritar",
                color: "m"
            },
            {
                icon: "normal",
                name: "normal",
                color: "q"
            }
        ],
        "welcome1": "Tu historia empieza aquí, ~b~",
        "welcome2": "Bienvenido a ~p~GTAHUB",
        "score": "Puntaje: ",
        "youCantUseHere": "No puedes usar eso aquí.",
        "getSupport": "Escribe en el chat ~h~~r~/soporte [Tu mensaje aquí]~/~|~/~ para recibir soporte.",
        "sirensEnabled": "Sonido de sirenas ~b~activado.",
        "sirensDisabled": "Sonido de sirenas ~b~desactivado.",
        "removeBelt": "~r~Debes quitarte el cinturón de seguridad",
        "showMenu": "Ver menu",
        "talk": "Hablar",
        "chat": "Chat",
        "animations": "Animaciones",
        "phone": "Celular",
        "inventory": "Inventario",
        "point": "Señalar",
        "unlockVehicle": "Abrir/cerra vehículo",
        "startEngine": "Motor",
        "vehicleMenu": "Opciones del vehículo",
        "vehiclePassenger": "Vehículo (pasajero)",
        "togglePhoneCamera": "Cambiar modo de cámara",
        "augmentFilter": "Aumentar filtro",
        "reduceFilter": "Disminuir filtro",
        "takePhoto": "Tomar foto",
        "moveSelfieCam": "Mover selfie-cam",
        "toggleHud": "Ocultar/mostrar hud",
        "toggleHelp": "Ocultar/mostrar esto",
        "commandList": [
            {
                title: "/me",
                command: "/me",
                help: "Expresa las acciones de tu personaje. Ejemplo: /me se ríe a carcajadas"
            },
            {
                title: "/do",
                command: "/do",
                help: "Describe el entorno y las acciones ajenas a tu personaje. Ejemplo: /do En el ambiente se podría percibir un olor nauseabundo"
            },
            {
                title: "OOC",
                command: "/b",
                help: "Comunícate con otros jugadores fuera de tu personaje."
            }
        ],
        "rightCommandList": [
            {
                title: "Dudas",
                command: "/duda",
                help: "Enviar una duda."
            },
            {
                title: "~icon_info-circle~ Soporte",
                command: "/soporte",
                help: "Solicitar soporte."
            }
        ],
        "move": "Mover",
        "rotate": "Rotar",
        "changeHeight": "Cambiar altura",
        "fixHeight": "Corregir altura",
        "moveFast": "Mover rápido",
        "save": "Guardar",
        "cancel": "Cancelar",
        "editing": "~h~~w~EDITANDO",
        "editingPos": "~y~Editando (Posición)",
        "editingRot": "~p~Editando (Rotación)",
        "days": ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
        "search": "Buscar",
        "delete": "~input_⌫ Borrar~",
        "model": "Modelo: ",
        "helicamNoti": "Usa la tecla ~b~Q~w~ para desactivar la cámara y la tecla ~b~Z~w~ para activar/desactivar el foco.",
        "format": "es-ES",
        "richPresence": "gtahub.gg/jugar | "
    },
    "en": {
        "brakeEmergencyNotification": "~w~Emergency brake activated",
        "enabledCruiseControl": "~w~Cruise control enabled at ~b~",
        "cruiseControlAugmented": "~w~Augmented cruise control speed ~b~+5",
        "cruiseControlReduced": "~w~Reduced cruise control speed ~b~-5",
        "speedUnit": "mph",
        "rechargedVoice": "~w~Voice recharged",
        "talkModes": [
            {
                icon: "low",
                name: "whisper",
                color: "c"
            },
            {
                icon: "shout",
                name: "shout",
                color: "m"
            },
            {
                icon: "normal",
                name: "normal",
                color: "q"
            }
        ],
        "welcome1": "Your story starts here, ~b~",
        "welcome2": "Welcome to ~p~GTAHUB",
        "score": "Score: ",
        "youCantUseHere": "You can't use that here.",
        "getSupport": "Type in chat ~h~~r~/support [Your message here]~/~|~/~ to get support.",
        "sirensEnabled": "Siren sound ~b~enabled.",
        "sirensDisabled": "Siren sound ~b~disabled.",
        "removeBelt": "~r~You must remove your seatbelt",
        "showMenu": "Show menu",
        "talk": "Talk",
        "chat": "Chat",
        "animations": "Animations",
        "phone": "Phone",
        "inventory": "Inventory",
        "point": "Point",
        "unlockVehicle": "Unlock/lock vehicle",
        "startEngine": "Engine",
        "vehicleMenu": "Vehicle options",
        "vehiclePassenger": "Vehicle (passenger)",
        "togglePhoneCamera": "Toggle camera mode",
        "augmentFilter": "Augment filter",
        "reduceFilter": "Reduce filter",
        "takePhoto": "Take photo",
        "moveSelfieCam": "Move selfie-cam",
        "toggleHud": "Show/Hide hud",
        "toggleHelp": "Show/Hide this",
        "commandList": [
            {
                title: "/me",
                command: "/me",
                help: "Express your character's actions. Example: /me laughs out loud"
            },
            {
                title: "/do",
                command: "/do",
                help: "Describe the environment and actions outside your character. Example: /do In the environment you could perceive a nauseating smell"
            },
            {
                title: "OOC",
                command: "/b",
                help: "Communicate with other players out of character."
            }
        ],
        "rightCommandList": [
            {
                title: "Questions",
                command: "/question",
                help: "Send a question."
            },
            {
                title: "~icon_info-circle~ Support",
                command: "/support",
                help: "Request support."
            }
        ],
        "move": "Move",
        "rotate": "Rotate",
        "changeHeight": "Change Height",
        "fixHeight": "Fix Height",
        "moveFast": "Move fast",
        "save": "Save",
        "cancel": "Cancel",
        "editing": "~h~~w~EDITING",
        "editingPos": "~y~Editing (Position)",
        "editingRot": "~p~Editing (Rotation)",
        "days": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        "search": "Search",
        "delete": "~input_⌫ Delete~",
        "model": "Model: ",
        "helicamNoti": "Use ~b~Q~w~ key to disable the camera and the ~b~Z~w~ key to toggle the spotlight on/off.",
        "format": "en-US",
        "richPresence": "gtahub.gg/play | "
    }
};
mp.getTranslations = function (keys, locale) {
    let result = {};
    const dataLocale = dataLocalization[locale] || {};
    keys.forEach(k => {
        const key = k;
        if (dataLocale[key] !== undefined) {
            result[key] = dataLocale[key];
        }
        else {
            result[key] = `Translation not found for '${key}' in '${locale}'`;
            mp.console.logInfo(`Error: Translation not found for '${key}' in '${locale}'`);
        }
    });
    return result;
};
mp.events.add("client:cef:ready", () => {
    mp.events.callRemote("cef:ready");
    mp.players.local.uiReady = true;
});
//// NEW SIMPLER TRANSLATION SYSTEM based on Proxy
let localization_locale = 'en';
let localized_data = dataLocalization['en'] || {};
mp.rpc("player:set_server_language", (lang) => {
    if (dataLocalization[lang] === undefined) {
        console.error(`Language '${lang}' is not available`);
        return;
    }
    localization_locale = lang;
    localized_data = dataLocalization[lang] || {};
});
mp.translations = new Proxy({}, {
    get: (target, key, receiver) => {
        const translation = localized_data[key];
        if (translation === undefined) {
            mp.console.logInfo(`Error: Translation not found for '${String(key)}' in '${localization_locale}'`);
            return `Translation not found for '${String(key)}' in '${localization_locale}'`;
        }
        return translation;
    }
});

}
{
/**
 * Login/register UI implementation.
 */
mp.rpc("loginscreen:show", (screen, username, email) => {
    mp.enableUI("login", false, true, true);
    mp.browserCall("loginscreenVM", "toggle", true);
    mp.browserExecute("loginscreenVM.screen=" + JSON.stringify(screen));
    mp.browserExecute("loginscreenVM.username=" + JSON.stringify(username));
    mp.browserExecute("loginscreenVM.email=" + JSON.stringify(email));
    mp.browserExecute("loginscreenVM.error=''");
});
mp.rpc("loginscreen:error", (error) => {
    mp.browserExecute("loginscreenVM.setError(" + JSON.stringify(error) + ")");
});
mp.rpc("loginscreen:hide", () => {
    mp.browserCall("loginscreenVM", "toggle", false);
    mp.browserExecute("loginscreenVM.screen=''");
    mp.disableUI("login");
});
// callback dispatchers, from cef to local to remote
mp.events.add("loginscreen:on_login", (email, password, totp) => {
    mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    mp.events.callRemote("loginscreen:on_login", email, password, totp);
});
mp.events.add("loginscreen:has_totp", (email, hasTotp) => {
    mp.events.callRemote("loginscreen:has_totp", email, hasTotp);
});
mp.events.add("loginscreen:on_register", (username, email, password) => {
    mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    mp.events.callRemote("loginscreen:on_register", username, email, password);
});
mp.events.add("loginscreen:on_recover_password", (email) => {
    mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    mp.events.callRemote("loginscreen:on_recover_password", email);
});

}
ui_loginscreen.js
{
/** Implements character customization UI */
// saves initial customization to re-apply after the view gets destroyed,
// the nearest we have to "reset" to the original customization state.
// that's because we don't want our player to get dirty due to the
// local modifications to customizations made locally.
let initialCustomization = {};
let initialCategories = [];
let customizationData = {};
// should respond charactercustomization:on_save(customization)
mp.rpc("charactercustomization:show", (categoriesJSON, customizationJson, customizationDataJson, promoCodes) => {
    mp.enableUI("charactercustomization", true, true, true);
    customizationData = JSON.parse(customizationDataJson);
    initialCustomization = JSON.parse(customizationJson);
    initialCategories = JSON.parse(categoriesJSON);
    if (initialCategories.length === 0) {
        initialCategories = customizationData.categories;
    }
    mp.browserSet("charactercustomizationVM", "categories", initialCategories);
    mp.browserSet("charactercustomizationVM", "customization", initialCustomization);
    mp.browserSet("charactercustomizationVM", "categoryIcons", customizationData.categoryIcons);
    mp.browserSet("charactercustomizationVM", "categoryNames", customizationData.categoryNames);
    mp.browserSet("charactercustomizationVM", "meta.headOverlayNames", customizationData.headOverlayNames);
    mp.browserSet("charactercustomizationVM", "meta.faceFeatureNames", customizationData.faceFeatureNames);
    mp.browserSet("charactercustomizationVM", "promoCodes", JSON.parse(promoCodes));
    mp.browserCall("charactercustomizationVM", "toggle", true);
});
mp.rpc("charactercustomization:hide", () => {
    // reset to original customization
    // disabled: may override server-side set customization.
    //mp.events.call("charactercustomization:on_customization_change", JSON.stringify(initialCustomization));
    mp.disableUI("charactercustomization");
    mp.browserCall("charactercustomizationVM", "toggle", false);
});
// called from CEF when customization category change, to set the appropiate camera
mp.events.add("charactercustomization:on_change_category", (newCategory) => {
    mp.events.callRemote("charactercustomization:on_change_category", newCategory);
});
// called from CEF when customization data change, to apply to the character visually
mp.events.add("charactercustomization:on_customization_change", (customizationJson) => {
    let customization = JSON.parse(customizationJson);
    let p = mp.players.local;
    [0, 1, 2, 6, 7].forEach(i => p.clearProp(i));
    p.model = customization.gender ? mp.game.joaat('mp_m_freemode_01') : mp.game.joaat('mp_f_freemode_01');
    let featureIndex = 0;
    for (const feature of customization.faceFeatures) {
        p.setFaceFeature(featureIndex, feature);
        featureIndex++;
    }
    p.setEyeColor(customization.eyeColor);
    let b = customization.headBlend;
    p.setHeadBlendData(b.shape1, b.shape2, 0, b.shape1, b.shape2, 0, b.shapeMix, b.skinMix, 0, false);
    if (initialCategories.indexOf("clothes") !== -1) {
        for (let i = 0; i <= 12; i++) {
            let clothes = customization.clothes[i];
            if (clothes) {
                p.setComponentVariation(i, clothes.drawable, clothes.texture, clothes.palette);
            }
            else {
                p.setComponentVariation(i, 0, 0, 0);
            }
        }
    }
    p.setHairColor(customization.hairColor, customization.hairHighlightColor);
    for (let overlayIndex = 0; overlayIndex <= 12; overlayIndex++) {
        let overlay = customization.headOverlays[overlayIndex];
        if (overlay) {
            p.setHeadOverlay(overlayIndex, overlay.index, overlay.opacity, overlay.colorId, overlay.secondaryColorId);
        }
        else {
            p.setHeadOverlay(overlayIndex, 255, 1, 0, 0); // disable overlay
        }
    }
});
// called from CEF when submitting the data
mp.events.add("charactercustomization:on_save", (customizationJson) => {
    mp.events.callRemote("charactercustomization:on_save", customizationJson);
});
mp.events.add("charactercustomization:on_cancel", () => {
    mp.events.callRemote("charactercustomization:on_cancel");
});
/** Customization struct:
customization: {
    hair: 0,
    hairColor: 0,
    hairHighlightColor: 0,
    headOverlays: {
        0: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        1: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        2: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        3: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        4: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        5: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        6: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        7: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        8: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        9: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        10: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        11: {index:0, opacity:1, colorId:0, secondaryColorId:0},
        12: {index:0, opacity:1, colorId:0, secondaryColorId:0}
    },
    faceFeatures: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    eyeColor: 0,
    headBlend: {
        shape1: 0, shape2: 0, skin1: 0, skin2: 0,
        shapeMix: 0.5, skinMix: 0.5
    }
}*/

}
ui_charactercustomization.js
ui_phone.js
{
System.register([], function (exports_1, context_1) {
    "use strict";
    var UIInterfaceManager, uiManager;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            UIInterfaceManager = class UIInterfaceManager {
                constructor() {
                    this.active = null;
                    this.blocks = {};
                    mp.blockPhoneOpen = false;
                    mp.events.add("menu:block_open", () => this.block("menu"));
                    mp.events.add("menu:unblock_open", () => this.unblock("menu"));
                }
                canOpen(name) {
                    if (this.blocks[name])
                        return false;
                    if (this.active && this.active !== name)
                        return false;
                    return true;
                }
                prepareOpen(name, opts = {}) {
                    const { forceCloseActive = false } = opts;
                    if (this.blocks[name])
                        return false;
                    if (this.active && this.active !== name) {
                        if (!forceCloseActive)
                            return false;
                        this.forceClose(this.active);
                        this.active = null;
                    }
                    this.active = name;
                    return true;
                }
                onClose(name) {
                    if (this.active === name) {
                        this.active = null;
                    }
                }
                block(name) {
                    this.blocks[name] = true;
                    if (name === "phone")
                        mp.blockPhoneOpen = true;
                }
                unblock(name) {
                    this.blocks[name] = false;
                    if (name === "phone")
                        mp.blockPhoneOpen = false;
                }
                forceClose(name) {
                    switch (name) {
                        case "menu":
                            mp.events.call("menu:force_close");
                            break;
                        case "phone":
                            mp.disableUI("phone");
                            mp.disableUI("phone-input");
                            mp.browserSet("phoneNewVM", "show", false);
                            mp.browserSet("phoneVM", "show", false);
                            mp.events.call("phone:on_close");
                            break;
                        case "dialog":
                            mp.events.call("dialog:force_close");
                            break;
                        case "playerinv":
                            mp.events.call("playerinv:on_close");
                            break;
                    }
                }
                getActive() {
                    return this.active;
                }
            };
            exports_1("uiManager", uiManager = new UIInterfaceManager());
        }
    };
});

}
ui_interface_manager
{
/** Chat input controller */
mp.gui.chat.show(false);
// trick to bulk-push many messages to the chat
// at once, to prevent the UI from hanging.
let messagesToPush = [];
let pushInChunkInterval = null;
mp.rpc("chat:push", (text) => {
    messagesToPush.push(text);
    if (messagesToPush.length > 100) {
        messagesToPush.splice(0, messagesToPush.length - 100);
    }
    if (pushInChunkInterval == null) {
        pushInChunkInterval = setTimeout(() => {
            mp.browserCall("chatVM", "addMessages", messagesToPush);
            pushInChunkInterval = null;
            messagesToPush.splice(0, messagesToPush.length);
        }, 50);
    }
});
mp.rpc("chat:set_timestamp", (toggle) => {
    mp.browserExecute("chatVM.timestamp = " + toggle + ";");
});
mp.rpc("chat:suggestions", (suggestionsJSON) => {
    mp.browserCall("chatVM", "setSuggestions", JSON.parse(suggestionsJSON));
});
mp.rpc("chat:show", (toggle) => {
    mp.browserCall("chatVM", "toggleShow", toggle);
});
function canOpenChat() {
    return !mp.isAnyUIEnabled() || mp.isInCall();
}
mp.useInput(mp.input.CHAT, true, () => {
    if (canOpenChat()) {
        // enable this UI.
        mp.enableUI("chat", false, false, true);
        mp.browserSet("chatVM", "commandList", mp.translations.commandList);
        mp.browserSet("chatVM", "rightCommandList", mp.translations.rightCommandList);
        mp.browserCall("chatVM", "toggleInput", true);
    }
});
mp.events.add("chat:on_submit", (text) => {
    // event? should be probably like any other event.
});
mp.events.add("chat:on_cancel", () => {
    mp.disableUI("chat");
});
mp.events.add("console", (output) => {
    mp.console.logInfo(`HTMLConsole: ${output}`);
});
mp.events.add("chat:on_input_change", (input) => mp.events.callRemote("chat:on_input_change", input));
// those are unsupported
mp.events.add("chat:clear", () => { });
mp.events.add("chat:activate", (toggle) => { });

}
ui_chat.js
{
/** Implement an UI to edit many cfg keys at the same time, clientside. */
mp.rpc("cfgeditor:init", (content) => {
    mp.enableUI("cfgeditor", true, true, true);
    mp.browserSet("cfgeditorVM", "content", content);
    mp.browserCall("cfgeditorVM", "doShow");
});
mp.rpc("cfgeditor:destroy", () => {
    mp.browserCall("cfgeditorVM", "doHide");
    mp.disableUI("cfgeditor");
});
mp.rpc("cfgeditor:on_saved", (saved, newContent) => {
    mp.events.callRemote("cfgeditor:on_saved", saved, saved ? newContent : "");
});

}
ui_cfgeditor.js
{
/**
 * This file contains the interface to interact with the joebill
 * generic main menu, using an HTML view.
 */
System.register(["./ui_interface_manager"], function (exports_1, context_1) {
    "use strict";
    var ui_interface_manager_1, menuShown, lastTab, lastPhoneKey, uiTabOpeners;
    var __moduleName = context_1 && context_1.id;
    function canOpenTab() {
        if (!ui_interface_manager_1.uiManager.canOpen("menu"))
            return false;
        if (Date.now() - lastPhoneKey < 150) {
            return false;
        }
        return !(mp.isAnyUIEnabled() && !uiTabOpeners.includes(mp.getTopUI()));
    }
    function handleTabPress() {
        if (!canOpenTab())
            return;
        let now = new Date().getTime();
        if (now - lastTab < 400) {
            return;
        }
        lastTab = now;
        if (!menuShown) {
            handleTabOpen();
        }
        else {
            handleTabClose();
        }
    }
    function handleTabOpen() {
        if (!ui_interface_manager_1.uiManager.prepareOpen("menu"))
            return;
        mp.enableUI("menu", true, true, true);
        // effects
        mp.game.graphics.transitionToBlurred(200);
        mp.game.graphics.startScreenEffect("SwitchHUDIn", 200, false);
        mp.game.audio.playSoundFrontend(2, "FocusIn", "HintCamSounds", true);
        // browser
        menuShown = true;
        mp.browserCall("menuVM", "toggle", true);
        mp.events.callRemote("phone:on_close");
    }
    function handleTabClose() {
        mp.disableUI("menu");
        // effects
        mp.game.audio.playSoundFrontend(2, "FocusOut", "HintCamSounds", true);
        mp.game.graphics.stopScreenEffect("SwitchHUDIn");
        mp.game.graphics.startScreenEffect("SwitchHUDOut", 200, false);
        mp.game.graphics.transitionFromBlurred(200);
        // browser
        menuShown = false;
        mp.browserCall("menuVM", "toggle", false);
        ui_interface_manager_1.uiManager.onClose("menu");
    }
    return {
        setters: [
            function (ui_interface_manager_1_1) {
                ui_interface_manager_1 = ui_interface_manager_1_1;
            }
        ],
        execute: function () {/**
             * This file contains the interface to interact with the joebill
             * generic main menu, using an HTML view.
             */
            menuShown = false;
            lastTab = 0;
            lastPhoneKey = 0;
            uiTabOpeners = ["menu", "dailyreward", "confirmation"];
            /** TAB to open/close menu */
            mp.useInput(mp.input.MENU, true, () => {
                handleTabPress();
            });
            /** Closes on esc too */
            mp.useInput(mp.input.CLOSE, false, () => {
                if (menuShown) {
                    handleTabPress();
                }
            });
            mp.useInput(mp.input.OPEN_PHONE, true, () => {
                lastPhoneKey = Date.now();
            });
            /* Methods to set the menu data */
            mp.rpc("menu:set_menu_data", (data) => {
                mp.browserExecute("menuVM.menu = " + data + ";");
            });
            mp.rpc("menu:set_text_scale", (index) => {
                mp.browserExecute("menuVM.setTextScale(" + index + ")");
            });
            mp.rpc("menu:select_tab", (tab) => {
                if (!menuShown) {
                    handleTabPress();
                }
                mp.browserExecute("menuVM.onSelectTab(" + tab + ")");
            });
            /* Methods to set the content */
            mp.rpc("menu:set_tab_content", (onlinePlayers, contentType, contentData) => {
                mp.browserExecute("menuVM.onRefreshContent(" + onlinePlayers + "," + JSON.stringify(contentType) + ", " + JSON.stringify(contentData) + ")");
            });
            /** Close CEF button */
            mp.events.add("menu:on_close", () => {
                handleTabPress();
            });
            /* Methods to delegate to backend from CEF. May use a wrapper function for less boilerplate */
            mp.events.add("menu:on_select_tab", (index) => {
                if (!mp.isUIEnabled("menu"))
                    return;
                mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
                mp.events.callRemote("menu:on_select_tab", index);
            });
            mp.events.add("menu:table:on_back", () => {
                if (mp.getTopUI() !== "menu")
                    return;
                mp.game.audio.playSoundFrontend(2, "BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
                mp.events.callRemote("menu:table:on_back");
            });
            mp.events.add("menu:table:on_click_description", () => {
                if (mp.getTopUI() !== "menu")
                    return;
                mp.game.audio.playSoundFrontend(2, "BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
                mp.events.callRemote("menu:table:on_click_description");
            });
            mp.events.add("menu:table:on_action", (actionIndex) => {
                if (mp.getTopUI() !== "menu")
                    return;
                mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
                mp.events.callRemote("menu:table:on_action", actionIndex);
            });
            mp.events.add("menu:table:on_action_special", (actionIndex) => {
                if (mp.getTopUI() !== "menu")
                    return;
                mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
                mp.events.callRemote("menu:table:on_action_special", actionIndex);
            });
            mp.events.add("menu:table:on_navigation", (navigationIndex) => {
                if (mp.getTopUI() !== "menu")
                    return;
                mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
                mp.events.callRemote("menu:table:on_navigation", navigationIndex);
            });
            mp.events.add("menu:table:on_click_item", (itemIndex) => {
                if (mp.getTopUI() !== "menu")
                    return;
                mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
                mp.events.callRemote("menu:table:on_click_item", itemIndex);
            });
            mp.events.add("menu:pricing:on_select_option", (index) => {
                if (mp.getTopUI() !== "menu")
                    return;
                mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
                mp.events.callRemote("menu:pricing:on_select_option", index);
            });
            mp.events.add("menu:pricing:on_redeem_code", () => {
                if (mp.getTopUI() !== "menu")
                    return;
                mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
                mp.events.callRemote("menu:pricing:on_redeem_code");
            });
            mp.events.add("menu:slider:on_select_location", (stringCoords) => {
                const coords = JSON.parse(stringCoords);
                handleTabPress();
                mp.events.callRemote("menu:slider:on_select_location", JSON.stringify(new mp.Vector3(coords.x, coords.y, 0)));
            });
            mp.events.add("menu:show_shop", () => {
                mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
            });
            mp.events.add("menu:force_close", () => {
                handleTabClose();
                setTimeout(() => {
                    handleTabClose();
                }, 200);
            });
            mp.events.add("menu:block_open", () => ui_interface_manager_1.uiManager.block("menu"));
            mp.events.add("menu:unblock_open", () => ui_interface_manager_1.uiManager.unblock("menu"));
        }
    };
});

}
ui_menu.js
{
/** Contains two-side inventory dialog */
let inventoryShown = false;
mp.rpc('inventory:on_click', (inventoryId, itemIndex) => {
    // inventoryId -1 means closed // wtf? rpc?
    mp.events.callRemote("inventory:on_click", inventoryId, itemIndex);
});

}
ui_inventory.js
ui_hud.js
{
/** UI that lets you accept/reject a request. */
let currentId = -1;
mp.rpc("confirmation:show", (id, message, milliseconds) => {
    if (currentId != -1) {
        mp.events.call("confirmation:hide");
        currentId = -1;
    }
    currentId = id;
    mp.enableUI("confirmation", false, false, false);
    mp.browserExecute("confirmationVM.time=" + JSON.stringify(milliseconds));
    mp.browserExecute("confirmationVM.maxTime=" + JSON.stringify(milliseconds));
    mp.browserExecute("confirmationVM.message=" + JSON.stringify(message));
    mp.browserExecute("confirmationVM.show=true;");
});
mp.rpc("confirmation:hide", () => {
    mp.browserExecute("confirmationVM.show=false;");
    mp.disableUI("confirmation");
    currentId = -1;
});
mp.useInput(mp.input.CONFIRM, true, () => {
    if (mp.isUIEnabled("confirmation") && currentId !== -1 && !mp.gui.cursor.visible) {
        mp.events.callRemote("confirmation:on_respond", currentId, true);
    }
});
mp.useInput(mp.input.DENY, true, () => {
    if (mp.isUIEnabled("confirmation") && currentId !== -1 && !mp.gui.cursor.visible) {
        mp.events.callRemote("confirmation:on_respond", currentId, false);
    }
});

}
ui_confirmation.js
{
/**
 * This file contains the interface to set the speedometer.
 */
let shown = false;
var language = "es";
mp.rpc("speedometer:show", (dataJson, isElectric) => {
    mp.browserExecute("speedometerVM.show=true");
    mp.browserExecute("speedometerVM.data=" + dataJson);
    let playerVehicle = mp.players.local.vehicle;
    if (playerVehicle) {
        mp.browserSet("speedometerVM", "isElectric", isElectric);
    }
    else {
        mp.browserSet("speedometerVM", "isElectric", false);
    }
    shown = true;
});
mp.rpc("speedometer:hide", () => {
    if (shown) {
        mp.browserExecute("speedometerVM.show=false");
        shown = false;
    }
});
mp.rpc("speedometer:set_data", (dataJson) => {
    mp.browserExecute("speedometerVM.data=" + dataJson);
});
mp.rpc("player:set_server_language", (lang) => {
    language = lang;
});
mp.setInterval(() => {
    let player = mp.players.local;
    // update client-side speedometer properties if im in a car
    if (shown && player.vehicle) {
        let vehicle = player.vehicle;
        let rpm = vehicle.rpm * 1000;
        let gear = vehicle.gear;
        let speed = vehicle.getSpeed();
        let maxSpeed = mp.game.vehicle.getVehicleModelMaxSpeed(vehicle.model);
        if (language === "es") {
            speed = Math.round(speed * 3.6);
        }
        else {
            speed = Math.round(speed * 2.236936);
        }
        mp.browserExecute("speedometerVM.rpm=" + rpm);
        mp.browserExecute("speedometerVM.speed=" + speed);
        mp.browserExecute("speedometerVM.gear=" + gear);
        mp.browserExecute("speedometerVM.speedMax=" + (language == 'es' ? Math.round(maxSpeed * 3.6) : Math.round(maxSpeed * 2.236936)).toString());
    }
}, 150);

}
ui_speedometer.js
{
/** Generic list menu with options to extend list items. Used for catalogos or selection of complex items. */
let itemMenuShown = false;
let currentMenuID = -1;
let pools = [
    mp.players, mp.vehicles, mp.objects, mp.pickups, mp.blips,
    mp.checkpoints, mp.markers, mp.colshapes, mp.labels
];
mp.rpc("itemmenu:set", (id, menuJson, initialSelection) => {
    itemMenuShown = true;
    mp.enableUI("itemmenu", true, true, true);
    currentMenuID = id;
    if (mp.isUIEnabled("menu"))
        mp.browserSet("itemmenuVM", "blackscreen", true);
    mp.browserCall("itemmenuVM", "doShow", JSON.parse(menuJson), initialSelection);
});
mp.rpc("itemmenu:hide", (id) => {
    if (itemMenuShown && id == currentMenuID) {
        mp.disableUI("itemmenu");
        mp.browserCall("itemmenuVM", "doHide");
        itemMenuShown = false;
        mp.browserSet("itemmenuVM", "blackscreen", false);
    }
});
mp.rpc("itemmenu:set_item_details", (id, index, details) => {
    if (currentMenuID == id) {
        mp.browserSet("itemmenuVM", "itemDetails", JSON.parse(details));
    }
});
// CEF
mp.events.add("itemmenu:on_select", (itemIndex) => {
    mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    mp.events.callRemote("itemmenu:on_select", currentMenuID, itemIndex);
});
mp.events.add("itemmenu:on_action", () => {
    mp.game.audio.playSoundFrontend(2, "SELECT", "HUD_LIQUOR_STORE_SOUNDSET", true);
    mp.events.callRemote("itemmenu:on_action", currentMenuID);
});
mp.events.add("itemmenu:on_secondary_action", () => {
    mp.game.audio.playSoundFrontend(2, "SELECT", "HUD_LIQUOR_STORE_SOUNDSET", true);
    mp.events.callRemote("itemmenu:on_secondary_action", currentMenuID);
});
mp.events.add("itemmenu:on_change_variation", (variationIdx, isNext) => {
    mp.game.audio.playSoundFrontend(2, "NAV_LEFT_RIGHT", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    mp.events.callRemote("itemmenu:on_change_variation", currentMenuID, variationIdx, isNext);
});
mp.events.add("itemmenu:on_change_color1", (color) => {
    mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    mp.events.callRemote("itemmenu:on_change_color1", currentMenuID, color);
});
mp.events.add("itemmenu:on_change_color2", (color) => {
    mp.game.audio.playSoundFrontend(2, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    mp.events.callRemote("itemmenu:on_change_color2", currentMenuID, color);
});
mp.events.add("itemmenu:on_close", () => {
    mp.game.audio.playSoundFrontend(2, "BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    mp.events.callRemote("itemmenu:on_close", currentMenuID);
});

}
ui_itemmenu.js
{
/** UI for input, list and confirmation dialogs. */
System.register(["./ui_interface_manager"], function (exports_1, context_1) {
    "use strict";
    var ui_interface_manager_1, currentDialogId, isWheel, numbers;
    var __moduleName = context_1 && context_1.id;
    function forceCloseDialog() {
        mp.events.callRemote("dialog:on_response", currentDialogId, false, 0, "", 0);
        if (currentDialogId !== 0) {
            mp.browserCall("dialogVM", "hide", currentDialogId);
        }
        mp.disableUI("dialog");
        currentDialogId = 0;
        ui_interface_manager_1.uiManager.onClose("dialog");
    }
    return {
        setters: [
            function (ui_interface_manager_1_1) {
                ui_interface_manager_1 = ui_interface_manager_1_1;
            }
        ],
        execute: function () {/** UI for input, list and confirmation dialogs. */
            currentDialogId = 0;
            isWheel = false;
            mp.rpc("dialog:show", (id, content) => {
                const parsedContent = JSON.parse(content);
                currentDialogId = id;
                isWheel = parsedContent.isWheel;
                if (!parsedContent.isWheel && ui_interface_manager_1.uiManager.getActive() === "playerinv") {
                    forceCloseDialog();
                    return;
                }
                if (parsedContent.isWheel) {
                    const canOpen = ui_interface_manager_1.uiManager.prepareOpen("dialog");
                    if (!canOpen) {
                        forceCloseDialog();
                        return;
                    }
                }
                mp.browserCall("dialogVM", "show", id, parsedContent);
                mp.enableUI("dialog", false, true, true);
                if (mp.isUIEnabled("menu"))
                    mp.browserSet("dialogVM", "blackscreen", true);
            });
            mp.rpc("player:allow_dangerous_input", (allow) => {
                mp.browserSet("dialogVM", "allowDangerousInput", allow);
            });
            mp.rpc("dialog:hide", (id) => {
                if (currentDialogId === id) {
                    mp.browserCall("dialogVM", "hide", id);
                    setTimeout(() => {
                        if (!mp.isUIEnabled("dialog"))
                            mp.browserSet("dialogVM", "blackscreen", false);
                    }, 50);
                    mp.disableUI("dialog");
                    if (isWheel) {
                        forceCloseDialog();
                    }
                    else {
                        currentDialogId = 0;
                    }
                }
            });
            mp.events.add("dialog:on_response", (id, response, list_selected, input, subitem) => {
                mp.events.callRemote("dialog:on_response", id, response, list_selected, input, subitem | 0);
            });
            mp.events.add("render", () => {
                if (currentDialogId != 0) {
                    mp.game.controls.disableControlAction(13, 200, true);
                }
            });
            numbers = {
                1: 0x31,
                2: 0x32,
                3: 0x33,
                4: 0x34,
                5: 0x35,
                6: 0x36,
                7: 0x37,
                8: 0x38,
                9: 0x39,
            };
            Object.keys(numbers).forEach((key) => {
                const number = parseInt(key);
                mp.keys.bind(numbers[number], true, function () {
                    try {
                        mp.browserCall("dialogVM", "numberSelect", number);
                    }
                    catch (e) {
                        mp.console.logError(`Error on number select ${number}: ${e}`);
                    }
                });
            });
            mp.events.add("dialog:force_close", () => {
                forceCloseDialog();
            });
        }
    };
});

}
ui_dialog.js
{
System.register(["./ui_interface_manager"], function (exports_1, context_1) {
    "use strict";
    var ui_interface_manager_1, currentPhoneState, currentPhoneDetails, phone_translations, clearNotificationInterval, callState, notifyEvent, conversationOpenEvent, conversationCreatedEvent, conversationsReload, isTyping;
    var __moduleName = context_1 && context_1.id;
    //Retired from phone.js due to the fact that can't be setted with browserSet
    function getDayName() {
        let date = new Date();
        let day = date.getDay();
        return phone_translations['days'][day];
    }
    function isInCall() {
        return callState !== 0;
    }
    function isTypingOnPhone() {
        return isTyping;
    }
    exports_1("isTypingOnPhone", isTypingOnPhone);
    return {
        setters: [
            function (ui_interface_manager_1_1) {
                ui_interface_manager_1 = ui_interface_manager_1_1;
            }
        ],
        execute: function () {
            currentPhoneState = {};
            currentPhoneDetails = {};
            phone_translations = {};
            mp.rpc("player:set_server_language", (lang) => {
                phone_translations = mp.getTranslations(['youCantUseHere', 'days', 'search'], lang);
            });
            mp.rpc("phone:visible", async (visible) => {
                if (visible) {
                    if (!ui_interface_manager_1.uiManager.prepareOpen("phone")) {
                        mp.events.call("phone:on_close");
                        return;
                    }
                }
                else {
                    ui_interface_manager_1.uiManager.onClose("phone");
                }
                if (!visible) {
                    mp.disableUI("phone");
                    mp.disableUI("phone-input");
                    mp.browserSet("phoneNewVM", "show", false);
                }
                else {
                    setTimeout(() => {
                        if (ui_interface_manager_1.uiManager.getActive() !== "phone") {
                            return;
                        }
                        mp.browserSet("phoneNewVM", "day", getDayName());
                        mp.browserSet("phoneNewVM", "search.placeholder", phone_translations['search']);
                        mp.enableUI("phone", false, false, false);
                        mp.browserSet("phoneNewVM", "show", true);
                        mp.game.audio.playSoundFrontend(2, "Hang_Up", "Phone_SoundSet_Michael", true);
                    }, 0);
                }
            });
            mp.events.add("phone:on_close", (instantly) => {
                ui_interface_manager_1.uiManager.onClose("phone");
                mp.game.audio.playSoundFrontend(2, "Click_Special", "WEB_NAVIGATION_SOUNDS_PHONE", true);
                mp.events.callRemote("phone:on_close");
            });
            /** Called by CEF when the phone enters an app that requires cursor */
            mp.events.add("phone:on_inputmode_toggle", (toggle) => {
                if (toggle) {
                    mp.enableUI("phone-input", false, false, true);
                }
                else {
                    mp.disableUI("phone-input");
                }
            });
            mp.events.add("phone:on_submit", () => {
                mp.game.audio.playSoundFrontend(2, "Click_Fail", "WEB_NAVIGATION_SOUNDS_PHONE", true);
            });
            mp.events.add("phone:on_navigate", () => {
                mp.game.audio.playSoundFrontend(2, "CLICK_BACK", "WEB_NAVIGATION_SOUNDS_PHONE", true);
            });
            mp.events.add("phone:on_back", () => {
                mp.game.audio.playSoundFrontend(2, "Click_Special", "WEB_NAVIGATION_SOUNDS_PHONE", true);
            });
            // Events from the backend
            mp.rpc("phone:ads", (adsJson) => {
                mp.browserSet("phoneNewVM", "ads", JSON.parse(adsJson));
            });
            mp.rpc("phone:ad_publish_info", (adPublishInfo) => {
                mp.browserSet("phoneNewVM", "adPublishInfo", adPublishInfo);
            });
            mp.rpc("phone:ad_edit_info", (adEditInfo) => {
                mp.browserSet("phoneNewVM", "adEditInfo", adEditInfo);
            });
            mp.rpc("phone:can_switch_to_alternative", (canSwitchToAlternative) => {
                mp.browserSet("phoneNewVM", "canSwitchToAlternative", canSwitchToAlternative);
            });
            mp.rpc("phone:alternative_name", (alternativeName) => {
                mp.browserSet("phoneNewVM", "alternativeName", alternativeName);
            });
            mp.rpc("phone:alternative_enabled", (alternativeEnabled) => {
                mp.browserSet("phoneNewVM", "alternativeEnabled", alternativeEnabled);
            });
            mp.rpc("phone:data", (stateJson) => {
                currentPhoneState = JSON.parse(stateJson);
                mp.browserSet("phoneNewVM", "phone", JSON.parse(stateJson));
                if (currentPhoneState.callState !== 0) {
                    mp.events.call("phone:on_inputmode_toggle", false); // disable input cursor while on call
                }
            });
            mp.rpc("phone:details", (detailsJson) => {
                currentPhoneDetails = JSON.parse(detailsJson);
                mp.browserSet("phoneNewVM", "phoneDetails", JSON.parse(detailsJson));
            });
            clearNotificationInterval = null;
            mp.rpc("phone:notify", (app, title, message, timestamp, duration, data, relatedNumber) => {
                mp.browserCall("phoneNewVM", "notify", app, title, message, timestamp, duration, JSON.parse(data), relatedNumber);
            });
            mp.rpc("phone:notify_popup", (message) => {
                mp.browserCall("phoneNewVM", "notifyPopup", message);
            });
            mp.rpc("phone:ad_tiers", (adTiers) => {
                mp.browserSet("phoneNewVM", "adTiers", JSON.parse(adTiers));
            });
            mp.rpc("phone:darknet_ad_tiers", (darknetAdTiers) => {
                mp.browserSet("phoneNewVM", "darknetAdTiers", JSON.parse(darknetAdTiers));
            });
            mp.rpc("phone:can_see_darknet", (toggle) => {
                mp.browserSet("phoneNewVM", "canSeeDarknet", toggle);
            });
            mp.rpc("phone:can_see_real_state", (toggle) => {
                mp.browserSet("phoneNewVM", "canSeeRealState", toggle);
            });
            mp.rpc("phone:phones_on", (numberListJson) => {
                mp.browserSet("phoneNewVM", "phonesOn", JSON.parse(numberListJson));
            });
            mp.rpc("phone:weather", (weather) => {
                mp.browserSet("phoneNewVM", "weather", weather);
            });
            mp.rpc("phone:time", (time) => {
                mp.browserSet("phoneNewVM", "time", time);
            });
            callState = 0;
            mp.isInCall = isInCall;
            mp.rpc("phone:call_state", (state) => {
                mp.browserSet("phoneNewVM", "callState", state);
                callState = state;
                if (isInCall() && mp.isUIEnabled("menu")) {
                    mp.events.call("menu:on_close");
                }
            });
            mp.rpc("phone:call_num", (callNum) => {
                mp.browserSet("phoneNewVM", "callNum", callNum);
            });
            mp.rpc("phone:share_contact", (contact) => {
                mp.browserCall("phoneNewVM", "openPreloadedContact", JSON.parse(contact));
            });
            mp.rpc("phone:update_taxi_state", (taxiData) => {
                mp.browserSet("taxiAppVM", "taxiData", JSON.parse(taxiData));
            });
            mp.rpc("phone:update_emergency_state", (serviceData, selectedServiceIdx) => {
                mp.browserSet("emergencyAppVM", "serviceData", JSON.parse(serviceData));
                if (selectedServiceIdx >= 0)
                    mp.browserSet("emergencyAppVM", "selectedServiceIdx", selectedServiceIdx);
            });
            // local events
            mp.events.add("phone:on_open_location", (locationJson) => {
                let location = JSON.parse(locationJson);
                if (location.x && location.y && location.z) {
                    mp.game.ui.setNewWaypoint(location.x, location.y);
                    mp.events.call("phone:on_close");
                }
            });
            mp.events.add("phone:ad_publish_on_toggle_position", () => {
                mp.browserExecute("phoneNewVM.adPublishSetPosition(" + JSON.stringify(mp.players.local.position) + ")");
            });
            mp.events.add("phone:on_call", (num) => {
                mp.events.callRemote("phone:on_call", num);
            });
            mp.events.add("phone:on_publish_ad", (text, tier, positionJSON, description = "", price = 0, image, isDarknet = false) => {
                mp.events.callRemote("phone:on_publish_ad", text, tier, positionJSON, description, price, image, isDarknet);
            });
            mp.events.add("phone:on_bump_ad", (adId, isDarknet = false) => {
                mp.events.callRemote("phone:on_bump_ad", adId, isDarknet);
            });
            mp.events.add("phone:on_delete_ad", (adId, isDarknet = false) => {
                mp.events.callRemote("phone:on_delete_ad", adId, isDarknet);
            });
            mp.events.add("phone:on_add_remove_contact", (num, name, note, image, added) => {
                mp.events.callRemote("phone:on_add_remove_contact", num, name, note, image, added);
            });
            mp.events.add("phone:on_block_unblock_number", (num, name, blocked) => {
                mp.events.callRemote("phone:on_block_unblock_number", num, name, blocked);
            });
            mp.events.add("phone:on_call_accept_reject", (accepts) => {
                mp.events.callRemote("phone:on_call_accept_reject", accepts);
            });
            mp.events.add("phone:on_toggle_calls", () => {
                mp.events.callRemote("phone:on_toggle_calls");
            });
            mp.events.add("phone:on_toggle_messages", () => mp.events.callRemote("phone:on_toggle_messages"));
            mp.events.add("phone:on_toggle_alternative", (toggle) => {
                mp.events.callRemote("phone:on_toggle_alternative", toggle);
            });
            mp.events.add("phone:on_select", (app) => {
                if (app === "cam") {
                    mp.events.call("phone:on_close");
                    mp.events.call("item_camera:toggle", "PHONE");
                    mp.events.callRemote("phone:on_open_camera");
                }
            });
            mp.events.add("phone:on_cam", () => {
                mp.events.call("item_camera:toggle", "PHONE");
                mp.events.callRemote("phone:on_open_camera");
            });
            mp.rpc("phone:settings", (settings) => {
                mp.browserSet("phoneNewVM", "rootSetting", JSON.parse(settings));
            });
            notifyEvent = "phone:notify_message";
            mp.rpc(notifyEvent, (message) => {
                mp.browserCall("phoneNewVM", "propagateToCurrentApp", notifyEvent, JSON.parse(message));
            });
            conversationOpenEvent = "phone:notify_conversation_open";
            mp.rpc(conversationOpenEvent, (device, conversation) => {
                mp.browserCall("phoneNewVM", "propagateToCurrentApp", conversationOpenEvent, device, conversation);
            });
            conversationCreatedEvent = "phone:conversation_created";
            mp.rpc(conversationCreatedEvent, (conversation, participants) => {
                mp.browserCall("phoneNewVM", "propagateToCurrentApp", conversationCreatedEvent, conversation, JSON.parse(participants));
            });
            conversationsReload = "phone:reload_conversation";
            mp.rpc(conversationsReload, (conversation) => {
                mp.browserCall("phoneNewVM", "propagateToCurrentApp", conversationsReload, conversation);
            });
            // Toggle cursor
            mp.rpc("phone:toggle_cursor", () => {
                mp.gui.cursor.visible = !mp.gui.cursor.visible;
                mp.browserCall("phoneNewVM", "setCursor", mp.gui.cursor.visible);
            });
            mp.rpc("phone:hide_cursor", () => {
                mp.gui.cursor.visible = false;
                mp.browserCall("phoneNewVM", "setCursor", false);
            });
            mp.events.add("phone:get_emoji_fav", () => {
                let emojisFav = [];
                if (mp.storage && mp.storage.data) {
                    emojisFav = mp.storage.data.emojisFav || [];
                }
                else {
                    mp.storage.data = { emojisFav: [] };
                }
                mp.browserCall("phoneNewVM", "getEmojiFav", emojisFav);
            });
            mp.events.add("phone:set_emoji_fav", (emojis) => {
                if (!mp.storage.data) {
                    mp.storage.data = {};
                }
                mp.storage.data.emojisFav = JSON.parse(emojis);
            });
            isTyping = false;
            mp.isTypingOnPhone = isTypingOnPhone;
            mp.events.add("phone:on_typing", (typing) => {
                isTyping = typing;
                mp.events.callRemote("phone:on_typing", typing);
            });
            mp.events.add("render", () => {
                if (isTyping) {
                    mp.game.controls.disableAllControlActions(0); // INPUTGROUP_MOVE
                    mp.game.controls.disableAllControlActions(27); // INPUTGROUP_VEH_MOVE_ALL
                    mp.game.controls.enableControlAction(0, 249, true); // INPUT_PUSH_TO_TALK
                    mp.game.controls.enableControlAction(1, 199, true); // INPUT_FRONTEND_PAUSE_ALTERNATE
                }
            });
        }
    };
});

}
{
mp.rpc("ui_item_drop:show", (itemWin, itemsList, title) => {
    mp.enableUI("itemDrop", true, false, true);
    mp.browserCall("itemDropVM", "showItemWin", JSON.parse(itemWin), JSON.parse(itemsList), title);
});
mp.rpc("ui_item_drop:hide", () => {
    mp.disableUI("itemDrop");
    mp.browserCall("itemDropVM", "close");
});
mp.events.add("ui_item_drop:close", () => {
    mp.disableUI("itemDrop");
    mp.browserCall("itemDropVM", "close");
});

}