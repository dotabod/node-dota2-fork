/**
 * Dota 2 module
 * @module Dota2
 */

/**
 * A Long class for representing a 64 bit two's-complement integer value 
 * derived from the Closure Library for stand-alone use and extended with unsigned support.
 * @external Long
 * @see {@link https://www.npmjs.com/package/long|long} npm package
 */
 
/**
 * The Steam for Node JS package, allowing interaction with Steam.
 * @external steam
 * @see {@link https://www.npmjs.com/package/steam|steam} npm package
 */

const util = require("util");
const Long = require("long");
const steam_resources = require("steam-resources-fork");
const { createLogger, format, transports } = require('winston');
const { EventEmitter } = require('events');

const DOTA_APP_ID = 570;

var Dota2 = exports;

/**
 * Protobuf schema created by Steam Resources. This is an alias of `steam.GC.Dota.Internal`.
 * This object can be used to obtain Dota2 specific protobuf types.
 * Object types can be created by `new Dota2.schema.<TypeName>(payload :Object);`.
 * Enum types can be referenced by `Dota2.schema.<EnumName>`, which returns an object array representing the enum.
 * @alias module:Dota2.schema
 */ 
Dota2.schema = steam_resources.GC.Dota.Internal;

/**
 * The Dota 2 client that communicates with the GC
 * @class 
 * @alias module:Dota2.Dota2Client
 * @param {Object} steamUser - node-steam-user client instance
 * @param {boolean} debug - Print debug information to console
 * @param {boolean} debugMore - Print even more debug information to console
 * @extends {EventEmitter} EventEmitter
 * @fires module:Dota2.Dota2Client#event:ready
 * @fires module:Dota2.Dota2Client#event:unhandled
 * @fires module:Dota2.Dota2Client#event:hellotimeout
 * @fires module:Dota2.Dota2Client#event:popup
 * @fires module:Dota2.Dota2Client#event:sourceTVGamesData
 * @fires module:Dota2.Dota2Client#event:inventoryUpdate
 * @fires module:Dota2.Dota2Client#event:practiceLobbyUpdate
 * @fires module:Dota2.Dota2Client#event:practiceLobbyCleared
 * @fires module:Dota2.Dota2Client#event:lobbyInviteUpdate
 * @fires module:Dota2.Dota2Client#event:lobbyInviteCleared
 * @fires module:Dota2.Dota2Client#event:practiceLobbyJoinResponse
 * @fires module:Dota2.Dota2Client#event:practiceLobbyListData
 * @fires module:Dota2.Dota2Client#event:practiceLobbyResponse
 * @fires module:Dota2.Dota2Client#event:lobbyDestroyed
 * @fires module:Dota2.Dota2Client#event:friendPracticeLobbyListData
 * @fires module:Dota2.Dota2Client#event:inviteCreated
 * @fires module:Dota2.Dota2Client#event:partyUpdate
 * @fires module:Dota2.Dota2Client#event:partyCleared
 * @fires module:Dota2.Dota2Client#event:partyInviteUpdate
 * @fires module:Dota2.Dota2Client#event:partyInviteCleared
 * @fires module:Dota2.Dota2Client#event:joinableCustomGameModes
 * @fires module:Dota2.Dota2Client#event:chatChannelsData
 * @fires module:Dota2.Dota2Client#event:chatJoin
 * @fires module:Dota2.Dota2Client#event:chatJoined
 * @fires module:Dota2.Dota2Client#event:chatLeave
 * @fires module:Dota2.Dota2Client#event:chatMessage
 * @fires module:Dota2.Dota2Client#event:profileCardData
 * @fires module:Dota2.Dota2Client#event:playerMatchHistoryData
 * @fires module:Dota2.Dota2Client#event:playerInfoData
 * @fires module:Dota2.Dota2Client#event:playerStatsData
 * @fires module:Dota2.Dota2Client#event:trophyListData
 * @fires module:Dota2.Dota2Client#event:hallOfFameData
 * @fires module:Dota2.Dota2Client#event:playerCardRoster
 * @fires module:Dota2.Dota2Client#event:playerCardDrafted
 * @fires module:Dota2.Dota2Client#event:liveLeagueGamesUpdate
 * @fires module:Dota2.Dota2Client#event:topLeagueMatchesData
 * @fires module:Dota2.Dota2Client#event:teamData
 * @fires module:Dota2.Dota2Client#event:matchesData
 * @fires module:Dota2.Dota2Client#event:matchDetailsData
 * @fires module:Dota2.Dota2Client#event:matchMinimalDetailsData
 * @fires module:Dota2.Dota2Client#event:matchmakingStatsData
 * @fires module:Dota2.Dota2Client#event:topFriendMatchesData
 * @fires module:Dota2.Dota2Client#event:tipResponse
 * @fires module:Dota2.Dota2Client#event:tipped
 */
Dota2.Dota2Client = function Dota2Client(steamUser, debug, debugMore) {
    EventEmitter.call(this);
    this.debug = debug || false;
    this.debugMore = debugMore || false;
    
    /**
     * The logger used to write debug messages. This is a WinstonJS logger, 
     * feel free to configure it as you like
     * @type {winston.Logger}
     */
    this.Logger = createLogger({
        transports: [new transports.Console()],
        format: format.combine(
            format.colorize(),
            format.timestamp({
                format: 'D MMM HH:mm:ss'
            }),
            format.printf(nfo => {
                return `${nfo.timestamp} - ${nfo.message}`
            })
        )
    });
    if(debug) this.Logger.level = "debug";
    if(debugMore) this.Logger.level = "silly";
    
    /** The current state of the bot's inventory. Contains cosmetics, player cards, ... 
     * @type {CSOEconItem[]} 
     */
    this.Inventory = [];
    /** The chat channels the bot has joined 
     * @type {CMsgDOTAJoinChatChannelResponse[]}
     */
    this.chatChannels = []; // Map channel names to channel data.
    /** The lobby the bot is currently in. Falsy if the bot isn't in a lobby. 
     * @type {CSODOTALobby}
     */
    this.Lobby = null;
    /** The currently active lobby invitation. Falsy if the bot has not been invited. 
     * @type {CSODOTALobbyInvite}
     */
    this.LobbyInvite = null;
    /** The party the bot is currently in. Falsy if the bot isn't in a party.
    * @type {CSODOTAParty}
    */
    this.Party = null;
    /** The currently active party invitation. Falsy if the bot has not been invited.
     * @type {CSODOTAPartyInvite}
     */
    this.PartyInvite = null;

    this._user = steamUser;
    this._appid = DOTA_APP_ID;
    
    this._gcReady = false;
    this._gcClientHelloIntervalId = null;
    this._gcConnectionStatus = Dota2.schema.GCConnectionStatus.GCConnectionStatus_NO_SESSION;
    
    this._protoBufHeader = {
        "msg": "",
        "proto": {
            "client_steam_id": this._user.steamID,
            "source_app_id": this._appid
        }
    };

    this._user.on('receivedFromGC', (appId, msgType, payload) => {
        this.Logger.debug("Dota2 fromGC: " + Dota2._getMessageName(msgType));

        if (msgType in this._handlers) {
            this._handlers[msgType].call(this, payload);
        } else {
            this.emit('unhandled', msgType, Dota2._getMessageName(msgType));
        }
    });

    this._sendClientHello = () => {
        if (this._gcReady) {
            if (this._gcClientHelloIntervalId) {
                clearInterval(this._gcClientHelloIntervalId);
                this._gcClientHelloIntervalId = null;
            }
            return;
        }
        if (this._gcClientHelloCount > 10) {
            this.Logger.warn("ClientHello has taken longer than 30 seconds! Reporting timeout...")
            this._gcClientHelloCount = 0;
            this.emit("hellotimeout");
        }
        
        this.Logger.debug("Sending ClientHello");
        
        if (!this._user) {
            this.Logger.error("Where the fuck is _gc?");
        } else {
            this._user.sendToGC(
                this._appid,
                Dota2.schema.EGCBaseClientMsg.k_EMsgGCClientHello,
                {},
                new Dota2.schema.CMsgClientHello({}).toBuffer()
            );
        }

        this._gcClientHelloCount++;
    };
};
util.inherits(Dota2.Dota2Client, EventEmitter);

// Methods

/**
 * Converts a 64bit Steam ID to a Dota2 account ID by deleting the 32 most significant bits
 * @alias module:Dota2.Dota2Client.ToAccountID
 * @param {string} steamID - String representation of a 64bit Steam ID
 * @returns {number} Dota2 account ID corresponding with steamID
 */
Dota2.Dota2Client.prototype.ToAccountID = function(steamID) {
    return new Long.fromString(""+steamID).sub('76561197960265728').toNumber();
};
/**
 * Converts a Dota2 account ID to a 64bit Steam ID
 * @alias module:Dota2.Dota2Client.ToSteamID
 * @param {string} accid - String representation of a Dota 2 account ID
 * @returns {external:Long} 64bit Steam ID corresponding to the given Dota 2 account ID
 */
Dota2.Dota2Client.prototype.ToSteamID = function(accid) {
    return new Long.fromString(accid+"").add('76561197960265728');
};
/**
 * Reports to Steam that you're playing Dota 2, and then initiates communication with the Game Coordinator.
 * @alias module:Dota2.Dota2Client#launch
 */
Dota2.Dota2Client.prototype.launch = function() {
    /* Reports to Steam that we are running Dota 2. Initiates communication with GC with EMsgGCClientHello */
    this.Logger.debug("Launching Dota 2");
    
    this.AccountID = this.ToAccountID(this._user.steamID);
    this.Party = null;
    this.Lobby = null;
    this.PartyInvite = null;
    this.Inventory = [];
    this.chatChannels = [];
    this._user.gamesPlayed([this._appid]);

    // Keep knocking on the GCs door until it accepts us.
    // This is very bad practice and quite trackable.
    // The real client tends to send only one of these.
    // Really we should just send one when the connection status is GC online
    this._gcClientHelloCount = 0;
    this._gcClientHelloIntervalId = setInterval(this._sendClientHello, 6000);

    //Also immediately send clienthello
    setTimeout(this._sendClientHello, 1000);
};
/**
 * Stop sending a heartbeat to the GC and report to steam you're no longer playing Dota 2
 * @alias module:Dota2.Dota2Client#exit
 */
Dota2.Dota2Client.prototype.exit = function() {
    /* Reports to Steam we are not running any apps. */
    this.Logger.debug("Exiting Dota 2");

    /* stop knocking if exit comes before ready event */
    if (this._gcClientHelloIntervalId) {
        clearInterval(this._gcClientHelloIntervalId);
        this._gcClientHelloIntervalId = null;
    }
    this._gcReady = false;

    if (this._user.steamID) {
        this._user.gamesPlayed([]);
    }
};

Dota2.Dota2Client.prototype.sendToGC = function(type, payload, handler, callback) {
    if (!this._gcReady) {
        this.Logger.warn("GC not ready, please listen for the 'ready' event.");
        if (callback) callback(-1, null);
        return null;
    }

    this._user.sendToGC(
        this._appid,
        type,
        {},
        payload.toBuffer(),
        (appId, type, message) => {
            Dota2._convertCallback(this, message, handler, callback)
        }
    );
}

// Events
/**
 * Emitted when the connection with the GC has been established 
 * and the client is ready to take requests.
 * @event module:Dota2.Dota2Client#ready
 */
/**
 * Emitted when the GC sends a message that isn't yet treated by the library.
 * @event module:Dota2.Dota2Client#unhandled
 * @param {number} kMsg - Proto message type ID
 * @param {string} kMsg_name - Proto message type name
 */
/**
 * Emitted when the connection with the GC takes longer than 30s
 * @event module:Dota2.Dota2Client#hellotimeout
 */

// Handlers

var handlers = Dota2.Dota2Client.prototype._handlers = {};

handlers[Dota2.schema.EGCBaseClientMsg.k_EMsgGCClientWelcome] = function clientWelcomeHandler(message) {
    /* Response to our k_EMsgGCClientHello, now we can execute other GC commands. */

    // Only execute if _gcClientHelloIntervalID, otherwise it's already been handled (and we don't want to emit multiple 'ready');
    if (this._gcClientHelloIntervalId) {
        clearInterval(this._gcClientHelloIntervalId);
        this._gcClientHelloIntervalId = null;
    }

    this.Logger.debug("Received client welcome.");

    // Parse any caches
    this._gcReady = true;
    this._handleWelcomeCaches(message);
    this.emit("ready");
};

handlers[Dota2.schema.EGCBaseClientMsg.k_EMsgGCClientConnectionStatus] = function gcClientConnectionStatus(message) {
    /* Catch and handle changes in connection status, cuz reasons u know. */
    var status = Dota2.schema.CMsgConnectionStatus.decode(message).status;
    
    if (status) this._gcConnectionStatus = status;

    switch (status) {
        case Dota2.schema.GCConnectionStatus.GCConnectionStatus_HAVE_SESSION:
            this.Logger.debug("GC Connection Status regained.");

            // Only execute if _gcClientHelloIntervalID, otherwise it's already been handled (and we don't want to emit multiple 'ready');
            if (this._gcClientHelloIntervalId) {
                clearInterval(this._gcClientHelloIntervalId);
                this._gcClientHelloIntervalId = null;

                this._gcReady = true;
                this.emit("ready");
            }
            break;

        default:
            this.Logger.debug(Object.keys(Dota2.schema.GCConnectionStatus).find(key => Dota2.schema.GCConnectionStatus[key] === status));
            
            this.Logger.debug("GC Connection Status unreliable - " + status);

            // Only execute if !_gcClientHelloIntervalID, otherwise it's already been handled (and we don't want to emit multiple 'unready');
            if (!this._gcClientHelloIntervalId) {
                this._gcClientHelloIntervalId = setInterval(this._sendClientHello, 5000); // Continually try regain GC session

                this._gcReady = false;
                this.emit("unready");
            }
            break;
    }
};


require("./handlers/cache");
require("./handlers/inventory");
require("./handlers/chat");
require("./handlers/guild");
require("./handlers/community");
require("./handlers/helper");
require("./handlers/match");
require("./handlers/lobbies");
require("./handlers/parties");
require("./handlers/leagues");
require("./handlers/sourcetv");
require("./handlers/team");
require("./handlers/custom");
require("./handlers/general");
require("./handlers/fantasy");
require("./handlers/compendium");