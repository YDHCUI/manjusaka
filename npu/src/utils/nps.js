/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const nps = $root.nps = (() => {

    /**
     * Namespace nps.
     * @exports nps
     * @namespace
     */
    const nps = {};

    nps.Agent = (function() {

        /**
         * Properties of an Agent.
         * @memberof nps
         * @interface IAgent
         * @property {string|null} [id] Agent id
         * @property {string|null} [target] Agent target
         * @property {string|null} [intranet] Agent intranet
         * @property {string|null} [username] Agent username
         * @property {string|null} [hostname] Agent hostname
         * @property {string|null} [platform] Agent platform
         * @property {string|null} [arch] Agent arch
         * @property {string|null} [process] Agent process
         * @property {string|null} [pid] Agent pid
         * @property {string|null} [internet] Agent internet
         * @property {string|null} [note] Agent note
         * @property {number|Long|null} [updateat] Agent updateat
         * @property {boolean|null} [npc2] Agent npc2
         */

        /**
         * Constructs a new Agent.
         * @memberof nps
         * @classdesc Represents an Agent.
         * @implements IAgent
         * @constructor
         * @param {nps.IAgent=} [properties] Properties to set
         */
        function Agent(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Agent id.
         * @member {string} id
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.id = "";

        /**
         * Agent target.
         * @member {string} target
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.target = "";

        /**
         * Agent intranet.
         * @member {string} intranet
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.intranet = "";

        /**
         * Agent username.
         * @member {string} username
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.username = "";

        /**
         * Agent hostname.
         * @member {string} hostname
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.hostname = "";

        /**
         * Agent platform.
         * @member {string} platform
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.platform = "";

        /**
         * Agent arch.
         * @member {string} arch
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.arch = "";

        /**
         * Agent process.
         * @member {string} process
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.process = "";

        /**
         * Agent pid.
         * @member {string} pid
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.pid = "";

        /**
         * Agent internet.
         * @member {string} internet
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.internet = "";

        /**
         * Agent note.
         * @member {string} note
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.note = "";

        /**
         * Agent updateat.
         * @member {number|Long} updateat
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.updateat = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Agent npc2.
         * @member {boolean} npc2
         * @memberof nps.Agent
         * @instance
         */
        Agent.prototype.npc2 = false;

        /**
         * Creates a new Agent instance using the specified properties.
         * @function create
         * @memberof nps.Agent
         * @static
         * @param {nps.IAgent=} [properties] Properties to set
         * @returns {nps.Agent} Agent instance
         */
        Agent.create = function create(properties) {
            return new Agent(properties);
        };

        /**
         * Encodes the specified Agent message. Does not implicitly {@link nps.Agent.verify|verify} messages.
         * @function encode
         * @memberof nps.Agent
         * @static
         * @param {nps.IAgent} message Agent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Agent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.target != null && Object.hasOwnProperty.call(message, "target"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.target);
            if (message.intranet != null && Object.hasOwnProperty.call(message, "intranet"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.intranet);
            if (message.username != null && Object.hasOwnProperty.call(message, "username"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.username);
            if (message.hostname != null && Object.hasOwnProperty.call(message, "hostname"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.hostname);
            if (message.platform != null && Object.hasOwnProperty.call(message, "platform"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.platform);
            if (message.arch != null && Object.hasOwnProperty.call(message, "arch"))
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.arch);
            if (message.process != null && Object.hasOwnProperty.call(message, "process"))
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.process);
            if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.pid);
            if (message.internet != null && Object.hasOwnProperty.call(message, "internet"))
                writer.uint32(/* id 20, wireType 2 =*/162).string(message.internet);
            if (message.note != null && Object.hasOwnProperty.call(message, "note"))
                writer.uint32(/* id 21, wireType 2 =*/170).string(message.note);
            if (message.updateat != null && Object.hasOwnProperty.call(message, "updateat"))
                writer.uint32(/* id 22, wireType 0 =*/176).sint64(message.updateat);
            if (message.npc2 != null && Object.hasOwnProperty.call(message, "npc2"))
                writer.uint32(/* id 23, wireType 0 =*/184).bool(message.npc2);
            return writer;
        };

        /**
         * Encodes the specified Agent message, length delimited. Does not implicitly {@link nps.Agent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.Agent
         * @static
         * @param {nps.IAgent} message Agent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Agent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Agent message from the specified reader or buffer.
         * @function decode
         * @memberof nps.Agent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.Agent} Agent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Agent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.Agent();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.target = reader.string();
                    break;
                case 3:
                    message.intranet = reader.string();
                    break;
                case 4:
                    message.username = reader.string();
                    break;
                case 5:
                    message.hostname = reader.string();
                    break;
                case 6:
                    message.platform = reader.string();
                    break;
                case 7:
                    message.arch = reader.string();
                    break;
                case 8:
                    message.process = reader.string();
                    break;
                case 9:
                    message.pid = reader.string();
                    break;
                case 20:
                    message.internet = reader.string();
                    break;
                case 21:
                    message.note = reader.string();
                    break;
                case 22:
                    message.updateat = reader.sint64();
                    break;
                case 23:
                    message.npc2 = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Agent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.Agent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.Agent} Agent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Agent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Agent message.
         * @function verify
         * @memberof nps.Agent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Agent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.target != null && message.hasOwnProperty("target"))
                if (!$util.isString(message.target))
                    return "target: string expected";
            if (message.intranet != null && message.hasOwnProperty("intranet"))
                if (!$util.isString(message.intranet))
                    return "intranet: string expected";
            if (message.username != null && message.hasOwnProperty("username"))
                if (!$util.isString(message.username))
                    return "username: string expected";
            if (message.hostname != null && message.hasOwnProperty("hostname"))
                if (!$util.isString(message.hostname))
                    return "hostname: string expected";
            if (message.platform != null && message.hasOwnProperty("platform"))
                if (!$util.isString(message.platform))
                    return "platform: string expected";
            if (message.arch != null && message.hasOwnProperty("arch"))
                if (!$util.isString(message.arch))
                    return "arch: string expected";
            if (message.process != null && message.hasOwnProperty("process"))
                if (!$util.isString(message.process))
                    return "process: string expected";
            if (message.pid != null && message.hasOwnProperty("pid"))
                if (!$util.isString(message.pid))
                    return "pid: string expected";
            if (message.internet != null && message.hasOwnProperty("internet"))
                if (!$util.isString(message.internet))
                    return "internet: string expected";
            if (message.note != null && message.hasOwnProperty("note"))
                if (!$util.isString(message.note))
                    return "note: string expected";
            if (message.updateat != null && message.hasOwnProperty("updateat"))
                if (!$util.isInteger(message.updateat) && !(message.updateat && $util.isInteger(message.updateat.low) && $util.isInteger(message.updateat.high)))
                    return "updateat: integer|Long expected";
            if (message.npc2 != null && message.hasOwnProperty("npc2"))
                if (typeof message.npc2 !== "boolean")
                    return "npc2: boolean expected";
            return null;
        };

        /**
         * Creates an Agent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.Agent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.Agent} Agent
         */
        Agent.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.Agent)
                return object;
            let message = new $root.nps.Agent();
            if (object.id != null)
                message.id = String(object.id);
            if (object.target != null)
                message.target = String(object.target);
            if (object.intranet != null)
                message.intranet = String(object.intranet);
            if (object.username != null)
                message.username = String(object.username);
            if (object.hostname != null)
                message.hostname = String(object.hostname);
            if (object.platform != null)
                message.platform = String(object.platform);
            if (object.arch != null)
                message.arch = String(object.arch);
            if (object.process != null)
                message.process = String(object.process);
            if (object.pid != null)
                message.pid = String(object.pid);
            if (object.internet != null)
                message.internet = String(object.internet);
            if (object.note != null)
                message.note = String(object.note);
            if (object.updateat != null)
                if ($util.Long)
                    (message.updateat = $util.Long.fromValue(object.updateat)).unsigned = false;
                else if (typeof object.updateat === "string")
                    message.updateat = parseInt(object.updateat, 10);
                else if (typeof object.updateat === "number")
                    message.updateat = object.updateat;
                else if (typeof object.updateat === "object")
                    message.updateat = new $util.LongBits(object.updateat.low >>> 0, object.updateat.high >>> 0).toNumber();
            if (object.npc2 != null)
                message.npc2 = Boolean(object.npc2);
            return message;
        };

        /**
         * Creates a plain object from an Agent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.Agent
         * @static
         * @param {nps.Agent} message Agent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Agent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.id = "";
                object.target = "";
                object.intranet = "";
                object.username = "";
                object.hostname = "";
                object.platform = "";
                object.arch = "";
                object.process = "";
                object.pid = "";
                object.internet = "";
                object.note = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.updateat = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.updateat = options.longs === String ? "0" : 0;
                object.npc2 = false;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.target != null && message.hasOwnProperty("target"))
                object.target = message.target;
            if (message.intranet != null && message.hasOwnProperty("intranet"))
                object.intranet = message.intranet;
            if (message.username != null && message.hasOwnProperty("username"))
                object.username = message.username;
            if (message.hostname != null && message.hasOwnProperty("hostname"))
                object.hostname = message.hostname;
            if (message.platform != null && message.hasOwnProperty("platform"))
                object.platform = message.platform;
            if (message.arch != null && message.hasOwnProperty("arch"))
                object.arch = message.arch;
            if (message.process != null && message.hasOwnProperty("process"))
                object.process = message.process;
            if (message.pid != null && message.hasOwnProperty("pid"))
                object.pid = message.pid;
            if (message.internet != null && message.hasOwnProperty("internet"))
                object.internet = message.internet;
            if (message.note != null && message.hasOwnProperty("note"))
                object.note = message.note;
            if (message.updateat != null && message.hasOwnProperty("updateat"))
                if (typeof message.updateat === "number")
                    object.updateat = options.longs === String ? String(message.updateat) : message.updateat;
                else
                    object.updateat = options.longs === String ? $util.Long.prototype.toString.call(message.updateat) : options.longs === Number ? new $util.LongBits(message.updateat.low >>> 0, message.updateat.high >>> 0).toNumber() : message.updateat;
            if (message.npc2 != null && message.hasOwnProperty("npc2"))
                object.npc2 = message.npc2;
            return object;
        };

        /**
         * Converts this Agent to JSON.
         * @function toJSON
         * @memberof nps.Agent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Agent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Agent;
    })();

    nps.Config = (function() {

        /**
         * Properties of a Config.
         * @memberof nps
         * @interface IConfig
         * @property {string|null} [id] Config id
         * @property {number|null} [action] Config action
         * @property {string|null} [callback1] Config callback1
         * @property {string|null} [config] Config config
         * @property {string|null} [enckey] Config enckey
         * @property {number|null} [sleep] Config sleep
         * @property {string|null} [headers] Config headers
         * @property {string|null} [proxy] Config proxy
         */

        /**
         * Constructs a new Config.
         * @memberof nps
         * @classdesc Represents a Config.
         * @implements IConfig
         * @constructor
         * @param {nps.IConfig=} [properties] Properties to set
         */
        function Config(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Config id.
         * @member {string} id
         * @memberof nps.Config
         * @instance
         */
        Config.prototype.id = "";

        /**
         * Config action.
         * @member {number} action
         * @memberof nps.Config
         * @instance
         */
        Config.prototype.action = 0;

        /**
         * Config callback1.
         * @member {string} callback1
         * @memberof nps.Config
         * @instance
         */
        Config.prototype.callback1 = "";

        /**
         * Config config.
         * @member {string} config
         * @memberof nps.Config
         * @instance
         */
        Config.prototype.config = "";

        /**
         * Config enckey.
         * @member {string} enckey
         * @memberof nps.Config
         * @instance
         */
        Config.prototype.enckey = "";

        /**
         * Config sleep.
         * @member {number} sleep
         * @memberof nps.Config
         * @instance
         */
        Config.prototype.sleep = 0;

        /**
         * Config headers.
         * @member {string} headers
         * @memberof nps.Config
         * @instance
         */
        Config.prototype.headers = "";

        /**
         * Config proxy.
         * @member {string} proxy
         * @memberof nps.Config
         * @instance
         */
        Config.prototype.proxy = "";

        /**
         * Creates a new Config instance using the specified properties.
         * @function create
         * @memberof nps.Config
         * @static
         * @param {nps.IConfig=} [properties] Properties to set
         * @returns {nps.Config} Config instance
         */
        Config.create = function create(properties) {
            return new Config(properties);
        };

        /**
         * Encodes the specified Config message. Does not implicitly {@link nps.Config.verify|verify} messages.
         * @function encode
         * @memberof nps.Config
         * @static
         * @param {nps.IConfig} message Config message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Config.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.action != null && Object.hasOwnProperty.call(message, "action"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.action);
            if (message.callback1 != null && Object.hasOwnProperty.call(message, "callback1"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.callback1);
            if (message.config != null && Object.hasOwnProperty.call(message, "config"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.config);
            if (message.enckey != null && Object.hasOwnProperty.call(message, "enckey"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.enckey);
            if (message.sleep != null && Object.hasOwnProperty.call(message, "sleep"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.sleep);
            if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.headers);
            if (message.proxy != null && Object.hasOwnProperty.call(message, "proxy"))
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.proxy);
            return writer;
        };

        /**
         * Encodes the specified Config message, length delimited. Does not implicitly {@link nps.Config.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.Config
         * @static
         * @param {nps.IConfig} message Config message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Config.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Config message from the specified reader or buffer.
         * @function decode
         * @memberof nps.Config
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.Config} Config
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Config.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.Config();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.action = reader.int32();
                    break;
                case 3:
                    message.callback1 = reader.string();
                    break;
                case 4:
                    message.config = reader.string();
                    break;
                case 5:
                    message.enckey = reader.string();
                    break;
                case 6:
                    message.sleep = reader.int32();
                    break;
                case 7:
                    message.headers = reader.string();
                    break;
                case 8:
                    message.proxy = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Config message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.Config
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.Config} Config
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Config.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Config message.
         * @function verify
         * @memberof nps.Config
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Config.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.action != null && message.hasOwnProperty("action"))
                if (!$util.isInteger(message.action))
                    return "action: integer expected";
            if (message.callback1 != null && message.hasOwnProperty("callback1"))
                if (!$util.isString(message.callback1))
                    return "callback1: string expected";
            if (message.config != null && message.hasOwnProperty("config"))
                if (!$util.isString(message.config))
                    return "config: string expected";
            if (message.enckey != null && message.hasOwnProperty("enckey"))
                if (!$util.isString(message.enckey))
                    return "enckey: string expected";
            if (message.sleep != null && message.hasOwnProperty("sleep"))
                if (!$util.isInteger(message.sleep))
                    return "sleep: integer expected";
            if (message.headers != null && message.hasOwnProperty("headers"))
                if (!$util.isString(message.headers))
                    return "headers: string expected";
            if (message.proxy != null && message.hasOwnProperty("proxy"))
                if (!$util.isString(message.proxy))
                    return "proxy: string expected";
            return null;
        };

        /**
         * Creates a Config message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.Config
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.Config} Config
         */
        Config.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.Config)
                return object;
            let message = new $root.nps.Config();
            if (object.id != null)
                message.id = String(object.id);
            if (object.action != null)
                message.action = object.action | 0;
            if (object.callback1 != null)
                message.callback1 = String(object.callback1);
            if (object.config != null)
                message.config = String(object.config);
            if (object.enckey != null)
                message.enckey = String(object.enckey);
            if (object.sleep != null)
                message.sleep = object.sleep | 0;
            if (object.headers != null)
                message.headers = String(object.headers);
            if (object.proxy != null)
                message.proxy = String(object.proxy);
            return message;
        };

        /**
         * Creates a plain object from a Config message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.Config
         * @static
         * @param {nps.Config} message Config
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Config.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.id = "";
                object.action = 0;
                object.callback1 = "";
                object.config = "";
                object.enckey = "";
                object.sleep = 0;
                object.headers = "";
                object.proxy = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.action != null && message.hasOwnProperty("action"))
                object.action = message.action;
            if (message.callback1 != null && message.hasOwnProperty("callback1"))
                object.callback1 = message.callback1;
            if (message.config != null && message.hasOwnProperty("config"))
                object.config = message.config;
            if (message.enckey != null && message.hasOwnProperty("enckey"))
                object.enckey = message.enckey;
            if (message.sleep != null && message.hasOwnProperty("sleep"))
                object.sleep = message.sleep;
            if (message.headers != null && message.hasOwnProperty("headers"))
                object.headers = message.headers;
            if (message.proxy != null && message.hasOwnProperty("proxy"))
                object.proxy = message.proxy;
            return object;
        };

        /**
         * Converts this Config to JSON.
         * @function toJSON
         * @memberof nps.Config
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Config.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Config;
    })();

    nps.Entry = (function() {

        /**
         * Properties of an Entry.
         * @memberof nps
         * @interface IEntry
         * @property {string|null} [url] Entry url
         * @property {string|null} [path] Entry path
         * @property {string|null} [size] Entry size
         * @property {string|null} [auth] Entry auth
         * @property {boolean|null} [isfile] Entry isfile
         * @property {number|Long|null} [modified] Entry modified
         */

        /**
         * Constructs a new Entry.
         * @memberof nps
         * @classdesc Represents an Entry.
         * @implements IEntry
         * @constructor
         * @param {nps.IEntry=} [properties] Properties to set
         */
        function Entry(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Entry url.
         * @member {string} url
         * @memberof nps.Entry
         * @instance
         */
        Entry.prototype.url = "";

        /**
         * Entry path.
         * @member {string} path
         * @memberof nps.Entry
         * @instance
         */
        Entry.prototype.path = "";

        /**
         * Entry size.
         * @member {string} size
         * @memberof nps.Entry
         * @instance
         */
        Entry.prototype.size = "";

        /**
         * Entry auth.
         * @member {string} auth
         * @memberof nps.Entry
         * @instance
         */
        Entry.prototype.auth = "";

        /**
         * Entry isfile.
         * @member {boolean} isfile
         * @memberof nps.Entry
         * @instance
         */
        Entry.prototype.isfile = false;

        /**
         * Entry modified.
         * @member {number|Long} modified
         * @memberof nps.Entry
         * @instance
         */
        Entry.prototype.modified = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new Entry instance using the specified properties.
         * @function create
         * @memberof nps.Entry
         * @static
         * @param {nps.IEntry=} [properties] Properties to set
         * @returns {nps.Entry} Entry instance
         */
        Entry.create = function create(properties) {
            return new Entry(properties);
        };

        /**
         * Encodes the specified Entry message. Does not implicitly {@link nps.Entry.verify|verify} messages.
         * @function encode
         * @memberof nps.Entry
         * @static
         * @param {nps.IEntry} message Entry message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Entry.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.url != null && Object.hasOwnProperty.call(message, "url"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.url);
            if (message.path != null && Object.hasOwnProperty.call(message, "path"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.path);
            if (message.size != null && Object.hasOwnProperty.call(message, "size"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.size);
            if (message.auth != null && Object.hasOwnProperty.call(message, "auth"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.auth);
            if (message.isfile != null && Object.hasOwnProperty.call(message, "isfile"))
                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.isfile);
            if (message.modified != null && Object.hasOwnProperty.call(message, "modified"))
                writer.uint32(/* id 6, wireType 0 =*/48).sint64(message.modified);
            return writer;
        };

        /**
         * Encodes the specified Entry message, length delimited. Does not implicitly {@link nps.Entry.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.Entry
         * @static
         * @param {nps.IEntry} message Entry message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Entry.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Entry message from the specified reader or buffer.
         * @function decode
         * @memberof nps.Entry
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.Entry} Entry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Entry.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.Entry();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.url = reader.string();
                    break;
                case 2:
                    message.path = reader.string();
                    break;
                case 3:
                    message.size = reader.string();
                    break;
                case 4:
                    message.auth = reader.string();
                    break;
                case 5:
                    message.isfile = reader.bool();
                    break;
                case 6:
                    message.modified = reader.sint64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Entry message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.Entry
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.Entry} Entry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Entry.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Entry message.
         * @function verify
         * @memberof nps.Entry
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Entry.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.url != null && message.hasOwnProperty("url"))
                if (!$util.isString(message.url))
                    return "url: string expected";
            if (message.path != null && message.hasOwnProperty("path"))
                if (!$util.isString(message.path))
                    return "path: string expected";
            if (message.size != null && message.hasOwnProperty("size"))
                if (!$util.isString(message.size))
                    return "size: string expected";
            if (message.auth != null && message.hasOwnProperty("auth"))
                if (!$util.isString(message.auth))
                    return "auth: string expected";
            if (message.isfile != null && message.hasOwnProperty("isfile"))
                if (typeof message.isfile !== "boolean")
                    return "isfile: boolean expected";
            if (message.modified != null && message.hasOwnProperty("modified"))
                if (!$util.isInteger(message.modified) && !(message.modified && $util.isInteger(message.modified.low) && $util.isInteger(message.modified.high)))
                    return "modified: integer|Long expected";
            return null;
        };

        /**
         * Creates an Entry message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.Entry
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.Entry} Entry
         */
        Entry.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.Entry)
                return object;
            let message = new $root.nps.Entry();
            if (object.url != null)
                message.url = String(object.url);
            if (object.path != null)
                message.path = String(object.path);
            if (object.size != null)
                message.size = String(object.size);
            if (object.auth != null)
                message.auth = String(object.auth);
            if (object.isfile != null)
                message.isfile = Boolean(object.isfile);
            if (object.modified != null)
                if ($util.Long)
                    (message.modified = $util.Long.fromValue(object.modified)).unsigned = false;
                else if (typeof object.modified === "string")
                    message.modified = parseInt(object.modified, 10);
                else if (typeof object.modified === "number")
                    message.modified = object.modified;
                else if (typeof object.modified === "object")
                    message.modified = new $util.LongBits(object.modified.low >>> 0, object.modified.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from an Entry message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.Entry
         * @static
         * @param {nps.Entry} message Entry
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Entry.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.url = "";
                object.path = "";
                object.size = "";
                object.auth = "";
                object.isfile = false;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.modified = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.modified = options.longs === String ? "0" : 0;
            }
            if (message.url != null && message.hasOwnProperty("url"))
                object.url = message.url;
            if (message.path != null && message.hasOwnProperty("path"))
                object.path = message.path;
            if (message.size != null && message.hasOwnProperty("size"))
                object.size = message.size;
            if (message.auth != null && message.hasOwnProperty("auth"))
                object.auth = message.auth;
            if (message.isfile != null && message.hasOwnProperty("isfile"))
                object.isfile = message.isfile;
            if (message.modified != null && message.hasOwnProperty("modified"))
                if (typeof message.modified === "number")
                    object.modified = options.longs === String ? String(message.modified) : message.modified;
                else
                    object.modified = options.longs === String ? $util.Long.prototype.toString.call(message.modified) : options.longs === Number ? new $util.LongBits(message.modified.low >>> 0, message.modified.high >>> 0).toNumber() : message.modified;
            return object;
        };

        /**
         * Converts this Entry to JSON.
         * @function toJSON
         * @memberof nps.Entry
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Entry.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Entry;
    })();

    nps.Action = (function() {

        /**
         * Properties of an Action.
         * @memberof nps
         * @interface IAction
         * @property {string|null} [act] Action act
         * @property {string|null} [name] Action name
         * @property {string|null} [path] Action path
         * @property {string|null} [args] Action args
         * @property {Uint8Array|null} [data] Action data
         * @property {Array.<nps.IEntry>|null} [entrys] Action entrys
         */

        /**
         * Constructs a new Action.
         * @memberof nps
         * @classdesc Represents an Action.
         * @implements IAction
         * @constructor
         * @param {nps.IAction=} [properties] Properties to set
         */
        function Action(properties) {
            this.entrys = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Action act.
         * @member {string} act
         * @memberof nps.Action
         * @instance
         */
        Action.prototype.act = "";

        /**
         * Action name.
         * @member {string} name
         * @memberof nps.Action
         * @instance
         */
        Action.prototype.name = "";

        /**
         * Action path.
         * @member {string} path
         * @memberof nps.Action
         * @instance
         */
        Action.prototype.path = "";

        /**
         * Action args.
         * @member {string} args
         * @memberof nps.Action
         * @instance
         */
        Action.prototype.args = "";

        /**
         * Action data.
         * @member {Uint8Array} data
         * @memberof nps.Action
         * @instance
         */
        Action.prototype.data = $util.newBuffer([]);

        /**
         * Action entrys.
         * @member {Array.<nps.IEntry>} entrys
         * @memberof nps.Action
         * @instance
         */
        Action.prototype.entrys = $util.emptyArray;

        /**
         * Creates a new Action instance using the specified properties.
         * @function create
         * @memberof nps.Action
         * @static
         * @param {nps.IAction=} [properties] Properties to set
         * @returns {nps.Action} Action instance
         */
        Action.create = function create(properties) {
            return new Action(properties);
        };

        /**
         * Encodes the specified Action message. Does not implicitly {@link nps.Action.verify|verify} messages.
         * @function encode
         * @memberof nps.Action
         * @static
         * @param {nps.IAction} message Action message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Action.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.act != null && Object.hasOwnProperty.call(message, "act"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.act);
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.path != null && Object.hasOwnProperty.call(message, "path"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.path);
            if (message.args != null && Object.hasOwnProperty.call(message, "args"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.args);
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 5, wireType 2 =*/42).bytes(message.data);
            if (message.entrys != null && message.entrys.length)
                for (let i = 0; i < message.entrys.length; ++i)
                    $root.nps.Entry.encode(message.entrys[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Action message, length delimited. Does not implicitly {@link nps.Action.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.Action
         * @static
         * @param {nps.IAction} message Action message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Action.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Action message from the specified reader or buffer.
         * @function decode
         * @memberof nps.Action
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.Action} Action
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Action.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.Action();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.act = reader.string();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 3:
                    message.path = reader.string();
                    break;
                case 4:
                    message.args = reader.string();
                    break;
                case 5:
                    message.data = reader.bytes();
                    break;
                case 6:
                    if (!(message.entrys && message.entrys.length))
                        message.entrys = [];
                    message.entrys.push($root.nps.Entry.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Action message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.Action
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.Action} Action
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Action.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Action message.
         * @function verify
         * @memberof nps.Action
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Action.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.act != null && message.hasOwnProperty("act"))
                if (!$util.isString(message.act))
                    return "act: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.path != null && message.hasOwnProperty("path"))
                if (!$util.isString(message.path))
                    return "path: string expected";
            if (message.args != null && message.hasOwnProperty("args"))
                if (!$util.isString(message.args))
                    return "args: string expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                    return "data: buffer expected";
            if (message.entrys != null && message.hasOwnProperty("entrys")) {
                if (!Array.isArray(message.entrys))
                    return "entrys: array expected";
                for (let i = 0; i < message.entrys.length; ++i) {
                    let error = $root.nps.Entry.verify(message.entrys[i]);
                    if (error)
                        return "entrys." + error;
                }
            }
            return null;
        };

        /**
         * Creates an Action message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.Action
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.Action} Action
         */
        Action.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.Action)
                return object;
            let message = new $root.nps.Action();
            if (object.act != null)
                message.act = String(object.act);
            if (object.name != null)
                message.name = String(object.name);
            if (object.path != null)
                message.path = String(object.path);
            if (object.args != null)
                message.args = String(object.args);
            if (object.data != null)
                if (typeof object.data === "string")
                    $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                else if (object.data.length)
                    message.data = object.data;
            if (object.entrys) {
                if (!Array.isArray(object.entrys))
                    throw TypeError(".nps.Action.entrys: array expected");
                message.entrys = [];
                for (let i = 0; i < object.entrys.length; ++i) {
                    if (typeof object.entrys[i] !== "object")
                        throw TypeError(".nps.Action.entrys: object expected");
                    message.entrys[i] = $root.nps.Entry.fromObject(object.entrys[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from an Action message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.Action
         * @static
         * @param {nps.Action} message Action
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Action.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.entrys = [];
            if (options.defaults) {
                object.act = "";
                object.name = "";
                object.path = "";
                object.args = "";
                if (options.bytes === String)
                    object.data = "";
                else {
                    object.data = [];
                    if (options.bytes !== Array)
                        object.data = $util.newBuffer(object.data);
                }
            }
            if (message.act != null && message.hasOwnProperty("act"))
                object.act = message.act;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.path != null && message.hasOwnProperty("path"))
                object.path = message.path;
            if (message.args != null && message.hasOwnProperty("args"))
                object.args = message.args;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
            if (message.entrys && message.entrys.length) {
                object.entrys = [];
                for (let j = 0; j < message.entrys.length; ++j)
                    object.entrys[j] = $root.nps.Entry.toObject(message.entrys[j], options);
            }
            return object;
        };

        /**
         * Converts this Action to JSON.
         * @function toJSON
         * @memberof nps.Action
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Action.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Action;
    })();

    nps.Plugin = (function() {

        /**
         * Properties of a Plugin.
         * @memberof nps
         * @interface IPlugin
         * @property {Uint8Array|null} [data] Plugin data
         * @property {string|null} [act] Plugin act
         * @property {string|null} [arch] Plugin arch
         * @property {string|null} [name] Plugin name
         * @property {string|null} [args] Plugin args
         * @property {string|null} [entry] Plugin entry
         */

        /**
         * Constructs a new Plugin.
         * @memberof nps
         * @classdesc Represents a Plugin.
         * @implements IPlugin
         * @constructor
         * @param {nps.IPlugin=} [properties] Properties to set
         */
        function Plugin(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Plugin data.
         * @member {Uint8Array} data
         * @memberof nps.Plugin
         * @instance
         */
        Plugin.prototype.data = $util.newBuffer([]);

        /**
         * Plugin act.
         * @member {string} act
         * @memberof nps.Plugin
         * @instance
         */
        Plugin.prototype.act = "";

        /**
         * Plugin arch.
         * @member {string} arch
         * @memberof nps.Plugin
         * @instance
         */
        Plugin.prototype.arch = "";

        /**
         * Plugin name.
         * @member {string} name
         * @memberof nps.Plugin
         * @instance
         */
        Plugin.prototype.name = "";

        /**
         * Plugin args.
         * @member {string} args
         * @memberof nps.Plugin
         * @instance
         */
        Plugin.prototype.args = "";

        /**
         * Plugin entry.
         * @member {string} entry
         * @memberof nps.Plugin
         * @instance
         */
        Plugin.prototype.entry = "";

        /**
         * Creates a new Plugin instance using the specified properties.
         * @function create
         * @memberof nps.Plugin
         * @static
         * @param {nps.IPlugin=} [properties] Properties to set
         * @returns {nps.Plugin} Plugin instance
         */
        Plugin.create = function create(properties) {
            return new Plugin(properties);
        };

        /**
         * Encodes the specified Plugin message. Does not implicitly {@link nps.Plugin.verify|verify} messages.
         * @function encode
         * @memberof nps.Plugin
         * @static
         * @param {nps.IPlugin} message Plugin message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Plugin.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.data);
            if (message.act != null && Object.hasOwnProperty.call(message, "act"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.act);
            if (message.arch != null && Object.hasOwnProperty.call(message, "arch"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.arch);
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.name);
            if (message.args != null && Object.hasOwnProperty.call(message, "args"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.args);
            if (message.entry != null && Object.hasOwnProperty.call(message, "entry"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.entry);
            return writer;
        };

        /**
         * Encodes the specified Plugin message, length delimited. Does not implicitly {@link nps.Plugin.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.Plugin
         * @static
         * @param {nps.IPlugin} message Plugin message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Plugin.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Plugin message from the specified reader or buffer.
         * @function decode
         * @memberof nps.Plugin
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.Plugin} Plugin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Plugin.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.Plugin();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.data = reader.bytes();
                    break;
                case 2:
                    message.act = reader.string();
                    break;
                case 3:
                    message.arch = reader.string();
                    break;
                case 4:
                    message.name = reader.string();
                    break;
                case 5:
                    message.args = reader.string();
                    break;
                case 6:
                    message.entry = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Plugin message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.Plugin
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.Plugin} Plugin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Plugin.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Plugin message.
         * @function verify
         * @memberof nps.Plugin
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Plugin.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                    return "data: buffer expected";
            if (message.act != null && message.hasOwnProperty("act"))
                if (!$util.isString(message.act))
                    return "act: string expected";
            if (message.arch != null && message.hasOwnProperty("arch"))
                if (!$util.isString(message.arch))
                    return "arch: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.args != null && message.hasOwnProperty("args"))
                if (!$util.isString(message.args))
                    return "args: string expected";
            if (message.entry != null && message.hasOwnProperty("entry"))
                if (!$util.isString(message.entry))
                    return "entry: string expected";
            return null;
        };

        /**
         * Creates a Plugin message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.Plugin
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.Plugin} Plugin
         */
        Plugin.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.Plugin)
                return object;
            let message = new $root.nps.Plugin();
            if (object.data != null)
                if (typeof object.data === "string")
                    $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                else if (object.data.length)
                    message.data = object.data;
            if (object.act != null)
                message.act = String(object.act);
            if (object.arch != null)
                message.arch = String(object.arch);
            if (object.name != null)
                message.name = String(object.name);
            if (object.args != null)
                message.args = String(object.args);
            if (object.entry != null)
                message.entry = String(object.entry);
            return message;
        };

        /**
         * Creates a plain object from a Plugin message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.Plugin
         * @static
         * @param {nps.Plugin} message Plugin
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Plugin.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if (options.bytes === String)
                    object.data = "";
                else {
                    object.data = [];
                    if (options.bytes !== Array)
                        object.data = $util.newBuffer(object.data);
                }
                object.act = "";
                object.arch = "";
                object.name = "";
                object.args = "";
                object.entry = "";
            }
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
            if (message.act != null && message.hasOwnProperty("act"))
                object.act = message.act;
            if (message.arch != null && message.hasOwnProperty("arch"))
                object.arch = message.arch;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.args != null && message.hasOwnProperty("args"))
                object.args = message.args;
            if (message.entry != null && message.hasOwnProperty("entry"))
                object.entry = message.entry;
            return object;
        };

        /**
         * Converts this Plugin to JSON.
         * @function toJSON
         * @memberof nps.Plugin
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Plugin.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Plugin;
    })();

    nps.AgentList = (function() {

        /**
         * Properties of an AgentList.
         * @memberof nps
         * @interface IAgentList
         * @property {string|null} [status] AgentList status
         * @property {Array.<nps.IAgent>|null} [agents] AgentList agents
         */

        /**
         * Constructs a new AgentList.
         * @memberof nps
         * @classdesc Represents an AgentList.
         * @implements IAgentList
         * @constructor
         * @param {nps.IAgentList=} [properties] Properties to set
         */
        function AgentList(properties) {
            this.agents = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AgentList status.
         * @member {string} status
         * @memberof nps.AgentList
         * @instance
         */
        AgentList.prototype.status = "";

        /**
         * AgentList agents.
         * @member {Array.<nps.IAgent>} agents
         * @memberof nps.AgentList
         * @instance
         */
        AgentList.prototype.agents = $util.emptyArray;

        /**
         * Creates a new AgentList instance using the specified properties.
         * @function create
         * @memberof nps.AgentList
         * @static
         * @param {nps.IAgentList=} [properties] Properties to set
         * @returns {nps.AgentList} AgentList instance
         */
        AgentList.create = function create(properties) {
            return new AgentList(properties);
        };

        /**
         * Encodes the specified AgentList message. Does not implicitly {@link nps.AgentList.verify|verify} messages.
         * @function encode
         * @memberof nps.AgentList
         * @static
         * @param {nps.IAgentList} message AgentList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AgentList.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.status);
            if (message.agents != null && message.agents.length)
                for (let i = 0; i < message.agents.length; ++i)
                    $root.nps.Agent.encode(message.agents[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified AgentList message, length delimited. Does not implicitly {@link nps.AgentList.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.AgentList
         * @static
         * @param {nps.IAgentList} message AgentList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AgentList.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AgentList message from the specified reader or buffer.
         * @function decode
         * @memberof nps.AgentList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.AgentList} AgentList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AgentList.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.AgentList();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.status = reader.string();
                    break;
                case 2:
                    if (!(message.agents && message.agents.length))
                        message.agents = [];
                    message.agents.push($root.nps.Agent.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AgentList message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.AgentList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.AgentList} AgentList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AgentList.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AgentList message.
         * @function verify
         * @memberof nps.AgentList
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AgentList.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.status != null && message.hasOwnProperty("status"))
                if (!$util.isString(message.status))
                    return "status: string expected";
            if (message.agents != null && message.hasOwnProperty("agents")) {
                if (!Array.isArray(message.agents))
                    return "agents: array expected";
                for (let i = 0; i < message.agents.length; ++i) {
                    let error = $root.nps.Agent.verify(message.agents[i]);
                    if (error)
                        return "agents." + error;
                }
            }
            return null;
        };

        /**
         * Creates an AgentList message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.AgentList
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.AgentList} AgentList
         */
        AgentList.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.AgentList)
                return object;
            let message = new $root.nps.AgentList();
            if (object.status != null)
                message.status = String(object.status);
            if (object.agents) {
                if (!Array.isArray(object.agents))
                    throw TypeError(".nps.AgentList.agents: array expected");
                message.agents = [];
                for (let i = 0; i < object.agents.length; ++i) {
                    if (typeof object.agents[i] !== "object")
                        throw TypeError(".nps.AgentList.agents: object expected");
                    message.agents[i] = $root.nps.Agent.fromObject(object.agents[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from an AgentList message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.AgentList
         * @static
         * @param {nps.AgentList} message AgentList
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AgentList.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.agents = [];
            if (options.defaults)
                object.status = "";
            if (message.status != null && message.hasOwnProperty("status"))
                object.status = message.status;
            if (message.agents && message.agents.length) {
                object.agents = [];
                for (let j = 0; j < message.agents.length; ++j)
                    object.agents[j] = $root.nps.Agent.toObject(message.agents[j], options);
            }
            return object;
        };

        /**
         * Converts this AgentList to JSON.
         * @function toJSON
         * @memberof nps.AgentList
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AgentList.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AgentList;
    })();

    nps.LOGS = (function() {

        /**
         * Properties of a LOGS.
         * @memberof nps
         * @interface ILOGS
         * @property {string|null} [type] LOGS type
         * @property {string|null} [name] LOGS name
         * @property {string|null} [time] LOGS time
         * @property {string|null} [data] LOGS data
         */

        /**
         * Constructs a new LOGS.
         * @memberof nps
         * @classdesc Represents a LOGS.
         * @implements ILOGS
         * @constructor
         * @param {nps.ILOGS=} [properties] Properties to set
         */
        function LOGS(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LOGS type.
         * @member {string} type
         * @memberof nps.LOGS
         * @instance
         */
        LOGS.prototype.type = "";

        /**
         * LOGS name.
         * @member {string} name
         * @memberof nps.LOGS
         * @instance
         */
        LOGS.prototype.name = "";

        /**
         * LOGS time.
         * @member {string} time
         * @memberof nps.LOGS
         * @instance
         */
        LOGS.prototype.time = "";

        /**
         * LOGS data.
         * @member {string} data
         * @memberof nps.LOGS
         * @instance
         */
        LOGS.prototype.data = "";

        /**
         * Creates a new LOGS instance using the specified properties.
         * @function create
         * @memberof nps.LOGS
         * @static
         * @param {nps.ILOGS=} [properties] Properties to set
         * @returns {nps.LOGS} LOGS instance
         */
        LOGS.create = function create(properties) {
            return new LOGS(properties);
        };

        /**
         * Encodes the specified LOGS message. Does not implicitly {@link nps.LOGS.verify|verify} messages.
         * @function encode
         * @memberof nps.LOGS
         * @static
         * @param {nps.ILOGS} message LOGS message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LOGS.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.type);
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.time);
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.data);
            return writer;
        };

        /**
         * Encodes the specified LOGS message, length delimited. Does not implicitly {@link nps.LOGS.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.LOGS
         * @static
         * @param {nps.ILOGS} message LOGS message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LOGS.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LOGS message from the specified reader or buffer.
         * @function decode
         * @memberof nps.LOGS
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.LOGS} LOGS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LOGS.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.LOGS();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.type = reader.string();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 3:
                    message.time = reader.string();
                    break;
                case 4:
                    message.data = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LOGS message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.LOGS
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.LOGS} LOGS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LOGS.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LOGS message.
         * @function verify
         * @memberof nps.LOGS
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LOGS.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isString(message.type))
                    return "type: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.time != null && message.hasOwnProperty("time"))
                if (!$util.isString(message.time))
                    return "time: string expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!$util.isString(message.data))
                    return "data: string expected";
            return null;
        };

        /**
         * Creates a LOGS message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.LOGS
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.LOGS} LOGS
         */
        LOGS.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.LOGS)
                return object;
            let message = new $root.nps.LOGS();
            if (object.type != null)
                message.type = String(object.type);
            if (object.name != null)
                message.name = String(object.name);
            if (object.time != null)
                message.time = String(object.time);
            if (object.data != null)
                message.data = String(object.data);
            return message;
        };

        /**
         * Creates a plain object from a LOGS message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.LOGS
         * @static
         * @param {nps.LOGS} message LOGS
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LOGS.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.type = "";
                object.name = "";
                object.time = "";
                object.data = "";
            }
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.time != null && message.hasOwnProperty("time"))
                object.time = message.time;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            return object;
        };

        /**
         * Converts this LOGS to JSON.
         * @function toJSON
         * @memberof nps.LOGS
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LOGS.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return LOGS;
    })();

    nps.AgentEvent = (function() {

        /**
         * Properties of an AgentEvent.
         * @memberof nps
         * @interface IAgentEvent
         * @property {string|null} [id] AgentEvent id
         * @property {string|null} [sendto] AgentEvent sendto
         * @property {nps.IAgent|null} [init] AgentEvent init
         * @property {nps.IConfig|null} [conf] AgentEvent conf
         * @property {nps.IAction|null} [action] AgentEvent action
         * @property {nps.IPlugin|null} [plugin] AgentEvent plugin
         * @property {nps.ILOGS|null} [logs] AgentEvent logs
         * @property {nps.IAgentList|null} [list] AgentEvent list
         */

        /**
         * Constructs a new AgentEvent.
         * @memberof nps
         * @classdesc Represents an AgentEvent.
         * @implements IAgentEvent
         * @constructor
         * @param {nps.IAgentEvent=} [properties] Properties to set
         */
        function AgentEvent(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AgentEvent id.
         * @member {string} id
         * @memberof nps.AgentEvent
         * @instance
         */
        AgentEvent.prototype.id = "";

        /**
         * AgentEvent sendto.
         * @member {string} sendto
         * @memberof nps.AgentEvent
         * @instance
         */
        AgentEvent.prototype.sendto = "";

        /**
         * AgentEvent init.
         * @member {nps.IAgent|null|undefined} init
         * @memberof nps.AgentEvent
         * @instance
         */
        AgentEvent.prototype.init = null;

        /**
         * AgentEvent conf.
         * @member {nps.IConfig|null|undefined} conf
         * @memberof nps.AgentEvent
         * @instance
         */
        AgentEvent.prototype.conf = null;

        /**
         * AgentEvent action.
         * @member {nps.IAction|null|undefined} action
         * @memberof nps.AgentEvent
         * @instance
         */
        AgentEvent.prototype.action = null;

        /**
         * AgentEvent plugin.
         * @member {nps.IPlugin|null|undefined} plugin
         * @memberof nps.AgentEvent
         * @instance
         */
        AgentEvent.prototype.plugin = null;

        /**
         * AgentEvent logs.
         * @member {nps.ILOGS|null|undefined} logs
         * @memberof nps.AgentEvent
         * @instance
         */
        AgentEvent.prototype.logs = null;

        /**
         * AgentEvent list.
         * @member {nps.IAgentList|null|undefined} list
         * @memberof nps.AgentEvent
         * @instance
         */
        AgentEvent.prototype.list = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * AgentEvent enumof.
         * @member {"init"|"conf"|"action"|"plugin"|"logs"|"list"|undefined} enumof
         * @memberof nps.AgentEvent
         * @instance
         */
        Object.defineProperty(AgentEvent.prototype, "enumof", {
            get: $util.oneOfGetter($oneOfFields = ["init", "conf", "action", "plugin", "logs", "list"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new AgentEvent instance using the specified properties.
         * @function create
         * @memberof nps.AgentEvent
         * @static
         * @param {nps.IAgentEvent=} [properties] Properties to set
         * @returns {nps.AgentEvent} AgentEvent instance
         */
        AgentEvent.create = function create(properties) {
            return new AgentEvent(properties);
        };

        /**
         * Encodes the specified AgentEvent message. Does not implicitly {@link nps.AgentEvent.verify|verify} messages.
         * @function encode
         * @memberof nps.AgentEvent
         * @static
         * @param {nps.IAgentEvent} message AgentEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AgentEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.sendto != null && Object.hasOwnProperty.call(message, "sendto"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.sendto);
            if (message.init != null && Object.hasOwnProperty.call(message, "init"))
                $root.nps.Agent.encode(message.init, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            if (message.conf != null && Object.hasOwnProperty.call(message, "conf"))
                $root.nps.Config.encode(message.conf, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
            if (message.action != null && Object.hasOwnProperty.call(message, "action"))
                $root.nps.Action.encode(message.action, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
            if (message.plugin != null && Object.hasOwnProperty.call(message, "plugin"))
                $root.nps.Plugin.encode(message.plugin, writer.uint32(/* id 13, wireType 2 =*/106).fork()).ldelim();
            if (message.logs != null && Object.hasOwnProperty.call(message, "logs"))
                $root.nps.LOGS.encode(message.logs, writer.uint32(/* id 20, wireType 2 =*/162).fork()).ldelim();
            if (message.list != null && Object.hasOwnProperty.call(message, "list"))
                $root.nps.AgentList.encode(message.list, writer.uint32(/* id 21, wireType 2 =*/170).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified AgentEvent message, length delimited. Does not implicitly {@link nps.AgentEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.AgentEvent
         * @static
         * @param {nps.IAgentEvent} message AgentEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AgentEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AgentEvent message from the specified reader or buffer.
         * @function decode
         * @memberof nps.AgentEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.AgentEvent} AgentEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AgentEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.AgentEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.sendto = reader.string();
                    break;
                case 10:
                    message.init = $root.nps.Agent.decode(reader, reader.uint32());
                    break;
                case 11:
                    message.conf = $root.nps.Config.decode(reader, reader.uint32());
                    break;
                case 12:
                    message.action = $root.nps.Action.decode(reader, reader.uint32());
                    break;
                case 13:
                    message.plugin = $root.nps.Plugin.decode(reader, reader.uint32());
                    break;
                case 20:
                    message.logs = $root.nps.LOGS.decode(reader, reader.uint32());
                    break;
                case 21:
                    message.list = $root.nps.AgentList.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AgentEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.AgentEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.AgentEvent} AgentEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AgentEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AgentEvent message.
         * @function verify
         * @memberof nps.AgentEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AgentEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.sendto != null && message.hasOwnProperty("sendto"))
                if (!$util.isString(message.sendto))
                    return "sendto: string expected";
            if (message.init != null && message.hasOwnProperty("init")) {
                properties.enumof = 1;
                {
                    let error = $root.nps.Agent.verify(message.init);
                    if (error)
                        return "init." + error;
                }
            }
            if (message.conf != null && message.hasOwnProperty("conf")) {
                if (properties.enumof === 1)
                    return "enumof: multiple values";
                properties.enumof = 1;
                {
                    let error = $root.nps.Config.verify(message.conf);
                    if (error)
                        return "conf." + error;
                }
            }
            if (message.action != null && message.hasOwnProperty("action")) {
                if (properties.enumof === 1)
                    return "enumof: multiple values";
                properties.enumof = 1;
                {
                    let error = $root.nps.Action.verify(message.action);
                    if (error)
                        return "action." + error;
                }
            }
            if (message.plugin != null && message.hasOwnProperty("plugin")) {
                if (properties.enumof === 1)
                    return "enumof: multiple values";
                properties.enumof = 1;
                {
                    let error = $root.nps.Plugin.verify(message.plugin);
                    if (error)
                        return "plugin." + error;
                }
            }
            if (message.logs != null && message.hasOwnProperty("logs")) {
                if (properties.enumof === 1)
                    return "enumof: multiple values";
                properties.enumof = 1;
                {
                    let error = $root.nps.LOGS.verify(message.logs);
                    if (error)
                        return "logs." + error;
                }
            }
            if (message.list != null && message.hasOwnProperty("list")) {
                if (properties.enumof === 1)
                    return "enumof: multiple values";
                properties.enumof = 1;
                {
                    let error = $root.nps.AgentList.verify(message.list);
                    if (error)
                        return "list." + error;
                }
            }
            return null;
        };

        /**
         * Creates an AgentEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.AgentEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.AgentEvent} AgentEvent
         */
        AgentEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.AgentEvent)
                return object;
            let message = new $root.nps.AgentEvent();
            if (object.id != null)
                message.id = String(object.id);
            if (object.sendto != null)
                message.sendto = String(object.sendto);
            if (object.init != null) {
                if (typeof object.init !== "object")
                    throw TypeError(".nps.AgentEvent.init: object expected");
                message.init = $root.nps.Agent.fromObject(object.init);
            }
            if (object.conf != null) {
                if (typeof object.conf !== "object")
                    throw TypeError(".nps.AgentEvent.conf: object expected");
                message.conf = $root.nps.Config.fromObject(object.conf);
            }
            if (object.action != null) {
                if (typeof object.action !== "object")
                    throw TypeError(".nps.AgentEvent.action: object expected");
                message.action = $root.nps.Action.fromObject(object.action);
            }
            if (object.plugin != null) {
                if (typeof object.plugin !== "object")
                    throw TypeError(".nps.AgentEvent.plugin: object expected");
                message.plugin = $root.nps.Plugin.fromObject(object.plugin);
            }
            if (object.logs != null) {
                if (typeof object.logs !== "object")
                    throw TypeError(".nps.AgentEvent.logs: object expected");
                message.logs = $root.nps.LOGS.fromObject(object.logs);
            }
            if (object.list != null) {
                if (typeof object.list !== "object")
                    throw TypeError(".nps.AgentEvent.list: object expected");
                message.list = $root.nps.AgentList.fromObject(object.list);
            }
            return message;
        };

        /**
         * Creates a plain object from an AgentEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.AgentEvent
         * @static
         * @param {nps.AgentEvent} message AgentEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AgentEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.id = "";
                object.sendto = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.sendto != null && message.hasOwnProperty("sendto"))
                object.sendto = message.sendto;
            if (message.init != null && message.hasOwnProperty("init")) {
                object.init = $root.nps.Agent.toObject(message.init, options);
                if (options.oneofs)
                    object.enumof = "init";
            }
            if (message.conf != null && message.hasOwnProperty("conf")) {
                object.conf = $root.nps.Config.toObject(message.conf, options);
                if (options.oneofs)
                    object.enumof = "conf";
            }
            if (message.action != null && message.hasOwnProperty("action")) {
                object.action = $root.nps.Action.toObject(message.action, options);
                if (options.oneofs)
                    object.enumof = "action";
            }
            if (message.plugin != null && message.hasOwnProperty("plugin")) {
                object.plugin = $root.nps.Plugin.toObject(message.plugin, options);
                if (options.oneofs)
                    object.enumof = "plugin";
            }
            if (message.logs != null && message.hasOwnProperty("logs")) {
                object.logs = $root.nps.LOGS.toObject(message.logs, options);
                if (options.oneofs)
                    object.enumof = "logs";
            }
            if (message.list != null && message.hasOwnProperty("list")) {
                object.list = $root.nps.AgentList.toObject(message.list, options);
                if (options.oneofs)
                    object.enumof = "list";
            }
            return object;
        };

        /**
         * Converts this AgentEvent to JSON.
         * @function toJSON
         * @memberof nps.AgentEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AgentEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AgentEvent;
    })();

    nps.WsResize = (function() {

        /**
         * Properties of a WsResize.
         * @memberof nps
         * @interface IWsResize
         * @property {number|Long|null} [cols] WsResize cols
         * @property {number|Long|null} [rows] WsResize rows
         */

        /**
         * Constructs a new WsResize.
         * @memberof nps
         * @classdesc Represents a WsResize.
         * @implements IWsResize
         * @constructor
         * @param {nps.IWsResize=} [properties] Properties to set
         */
        function WsResize(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WsResize cols.
         * @member {number|Long} cols
         * @memberof nps.WsResize
         * @instance
         */
        WsResize.prototype.cols = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * WsResize rows.
         * @member {number|Long} rows
         * @memberof nps.WsResize
         * @instance
         */
        WsResize.prototype.rows = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new WsResize instance using the specified properties.
         * @function create
         * @memberof nps.WsResize
         * @static
         * @param {nps.IWsResize=} [properties] Properties to set
         * @returns {nps.WsResize} WsResize instance
         */
        WsResize.create = function create(properties) {
            return new WsResize(properties);
        };

        /**
         * Encodes the specified WsResize message. Does not implicitly {@link nps.WsResize.verify|verify} messages.
         * @function encode
         * @memberof nps.WsResize
         * @static
         * @param {nps.IWsResize} message WsResize message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WsResize.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.cols != null && Object.hasOwnProperty.call(message, "cols"))
                writer.uint32(/* id 1, wireType 0 =*/8).sint64(message.cols);
            if (message.rows != null && Object.hasOwnProperty.call(message, "rows"))
                writer.uint32(/* id 2, wireType 0 =*/16).sint64(message.rows);
            return writer;
        };

        /**
         * Encodes the specified WsResize message, length delimited. Does not implicitly {@link nps.WsResize.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.WsResize
         * @static
         * @param {nps.IWsResize} message WsResize message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WsResize.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WsResize message from the specified reader or buffer.
         * @function decode
         * @memberof nps.WsResize
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.WsResize} WsResize
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WsResize.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.WsResize();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.cols = reader.sint64();
                    break;
                case 2:
                    message.rows = reader.sint64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WsResize message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.WsResize
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.WsResize} WsResize
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WsResize.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WsResize message.
         * @function verify
         * @memberof nps.WsResize
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WsResize.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.cols != null && message.hasOwnProperty("cols"))
                if (!$util.isInteger(message.cols) && !(message.cols && $util.isInteger(message.cols.low) && $util.isInteger(message.cols.high)))
                    return "cols: integer|Long expected";
            if (message.rows != null && message.hasOwnProperty("rows"))
                if (!$util.isInteger(message.rows) && !(message.rows && $util.isInteger(message.rows.low) && $util.isInteger(message.rows.high)))
                    return "rows: integer|Long expected";
            return null;
        };

        /**
         * Creates a WsResize message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.WsResize
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.WsResize} WsResize
         */
        WsResize.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.WsResize)
                return object;
            let message = new $root.nps.WsResize();
            if (object.cols != null)
                if ($util.Long)
                    (message.cols = $util.Long.fromValue(object.cols)).unsigned = false;
                else if (typeof object.cols === "string")
                    message.cols = parseInt(object.cols, 10);
                else if (typeof object.cols === "number")
                    message.cols = object.cols;
                else if (typeof object.cols === "object")
                    message.cols = new $util.LongBits(object.cols.low >>> 0, object.cols.high >>> 0).toNumber();
            if (object.rows != null)
                if ($util.Long)
                    (message.rows = $util.Long.fromValue(object.rows)).unsigned = false;
                else if (typeof object.rows === "string")
                    message.rows = parseInt(object.rows, 10);
                else if (typeof object.rows === "number")
                    message.rows = object.rows;
                else if (typeof object.rows === "object")
                    message.rows = new $util.LongBits(object.rows.low >>> 0, object.rows.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a WsResize message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.WsResize
         * @static
         * @param {nps.WsResize} message WsResize
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WsResize.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.cols = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.cols = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.rows = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.rows = options.longs === String ? "0" : 0;
            }
            if (message.cols != null && message.hasOwnProperty("cols"))
                if (typeof message.cols === "number")
                    object.cols = options.longs === String ? String(message.cols) : message.cols;
                else
                    object.cols = options.longs === String ? $util.Long.prototype.toString.call(message.cols) : options.longs === Number ? new $util.LongBits(message.cols.low >>> 0, message.cols.high >>> 0).toNumber() : message.cols;
            if (message.rows != null && message.hasOwnProperty("rows"))
                if (typeof message.rows === "number")
                    object.rows = options.longs === String ? String(message.rows) : message.rows;
                else
                    object.rows = options.longs === String ? $util.Long.prototype.toString.call(message.rows) : options.longs === Number ? new $util.LongBits(message.rows.low >>> 0, message.rows.high >>> 0).toNumber() : message.rows;
            return object;
        };

        /**
         * Converts this WsResize to JSON.
         * @function toJSON
         * @memberof nps.WsResize
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WsResize.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return WsResize;
    })();

    nps.WsData = (function() {

        /**
         * Properties of a WsData.
         * @memberof nps
         * @interface IWsData
         * @property {string|null} [data] WsData data
         */

        /**
         * Constructs a new WsData.
         * @memberof nps
         * @classdesc Represents a WsData.
         * @implements IWsData
         * @constructor
         * @param {nps.IWsData=} [properties] Properties to set
         */
        function WsData(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WsData data.
         * @member {string} data
         * @memberof nps.WsData
         * @instance
         */
        WsData.prototype.data = "";

        /**
         * Creates a new WsData instance using the specified properties.
         * @function create
         * @memberof nps.WsData
         * @static
         * @param {nps.IWsData=} [properties] Properties to set
         * @returns {nps.WsData} WsData instance
         */
        WsData.create = function create(properties) {
            return new WsData(properties);
        };

        /**
         * Encodes the specified WsData message. Does not implicitly {@link nps.WsData.verify|verify} messages.
         * @function encode
         * @memberof nps.WsData
         * @static
         * @param {nps.IWsData} message WsData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WsData.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.data);
            return writer;
        };

        /**
         * Encodes the specified WsData message, length delimited. Does not implicitly {@link nps.WsData.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.WsData
         * @static
         * @param {nps.IWsData} message WsData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WsData.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WsData message from the specified reader or buffer.
         * @function decode
         * @memberof nps.WsData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.WsData} WsData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WsData.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.WsData();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.data = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WsData message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.WsData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.WsData} WsData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WsData.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WsData message.
         * @function verify
         * @memberof nps.WsData
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WsData.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!$util.isString(message.data))
                    return "data: string expected";
            return null;
        };

        /**
         * Creates a WsData message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.WsData
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.WsData} WsData
         */
        WsData.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.WsData)
                return object;
            let message = new $root.nps.WsData();
            if (object.data != null)
                message.data = String(object.data);
            return message;
        };

        /**
         * Creates a plain object from a WsData message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.WsData
         * @static
         * @param {nps.WsData} message WsData
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WsData.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.data = "";
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            return object;
        };

        /**
         * Converts this WsData to JSON.
         * @function toJSON
         * @memberof nps.WsData
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WsData.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return WsData;
    })();

    nps.WsPing = (function() {

        /**
         * Properties of a WsPing.
         * @memberof nps
         * @interface IWsPing
         */

        /**
         * Constructs a new WsPing.
         * @memberof nps
         * @classdesc Represents a WsPing.
         * @implements IWsPing
         * @constructor
         * @param {nps.IWsPing=} [properties] Properties to set
         */
        function WsPing(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new WsPing instance using the specified properties.
         * @function create
         * @memberof nps.WsPing
         * @static
         * @param {nps.IWsPing=} [properties] Properties to set
         * @returns {nps.WsPing} WsPing instance
         */
        WsPing.create = function create(properties) {
            return new WsPing(properties);
        };

        /**
         * Encodes the specified WsPing message. Does not implicitly {@link nps.WsPing.verify|verify} messages.
         * @function encode
         * @memberof nps.WsPing
         * @static
         * @param {nps.IWsPing} message WsPing message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WsPing.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified WsPing message, length delimited. Does not implicitly {@link nps.WsPing.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.WsPing
         * @static
         * @param {nps.IWsPing} message WsPing message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WsPing.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WsPing message from the specified reader or buffer.
         * @function decode
         * @memberof nps.WsPing
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.WsPing} WsPing
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WsPing.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.WsPing();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WsPing message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.WsPing
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.WsPing} WsPing
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WsPing.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WsPing message.
         * @function verify
         * @memberof nps.WsPing
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WsPing.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a WsPing message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.WsPing
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.WsPing} WsPing
         */
        WsPing.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.WsPing)
                return object;
            return new $root.nps.WsPing();
        };

        /**
         * Creates a plain object from a WsPing message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.WsPing
         * @static
         * @param {nps.WsPing} message WsPing
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WsPing.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this WsPing to JSON.
         * @function toJSON
         * @memberof nps.WsPing
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WsPing.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return WsPing;
    })();

    nps.WsMsg = (function() {

        /**
         * Properties of a WsMsg.
         * @memberof nps
         * @interface IWsMsg
         * @property {nps.IWsData|null} [data] WsMsg data
         * @property {nps.IWsResize|null} [resize] WsMsg resize
         * @property {nps.IWsPing|null} [ping] WsMsg ping
         */

        /**
         * Constructs a new WsMsg.
         * @memberof nps
         * @classdesc Represents a WsMsg.
         * @implements IWsMsg
         * @constructor
         * @param {nps.IWsMsg=} [properties] Properties to set
         */
        function WsMsg(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WsMsg data.
         * @member {nps.IWsData|null|undefined} data
         * @memberof nps.WsMsg
         * @instance
         */
        WsMsg.prototype.data = null;

        /**
         * WsMsg resize.
         * @member {nps.IWsResize|null|undefined} resize
         * @memberof nps.WsMsg
         * @instance
         */
        WsMsg.prototype.resize = null;

        /**
         * WsMsg ping.
         * @member {nps.IWsPing|null|undefined} ping
         * @memberof nps.WsMsg
         * @instance
         */
        WsMsg.prototype.ping = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * WsMsg enumof.
         * @member {"data"|"resize"|"ping"|undefined} enumof
         * @memberof nps.WsMsg
         * @instance
         */
        Object.defineProperty(WsMsg.prototype, "enumof", {
            get: $util.oneOfGetter($oneOfFields = ["data", "resize", "ping"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new WsMsg instance using the specified properties.
         * @function create
         * @memberof nps.WsMsg
         * @static
         * @param {nps.IWsMsg=} [properties] Properties to set
         * @returns {nps.WsMsg} WsMsg instance
         */
        WsMsg.create = function create(properties) {
            return new WsMsg(properties);
        };

        /**
         * Encodes the specified WsMsg message. Does not implicitly {@link nps.WsMsg.verify|verify} messages.
         * @function encode
         * @memberof nps.WsMsg
         * @static
         * @param {nps.IWsMsg} message WsMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WsMsg.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                $root.nps.WsData.encode(message.data, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.resize != null && Object.hasOwnProperty.call(message, "resize"))
                $root.nps.WsResize.encode(message.resize, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.ping != null && Object.hasOwnProperty.call(message, "ping"))
                $root.nps.WsPing.encode(message.ping, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified WsMsg message, length delimited. Does not implicitly {@link nps.WsMsg.verify|verify} messages.
         * @function encodeDelimited
         * @memberof nps.WsMsg
         * @static
         * @param {nps.IWsMsg} message WsMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WsMsg.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WsMsg message from the specified reader or buffer.
         * @function decode
         * @memberof nps.WsMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {nps.WsMsg} WsMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WsMsg.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.nps.WsMsg();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.data = $root.nps.WsData.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.resize = $root.nps.WsResize.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.ping = $root.nps.WsPing.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WsMsg message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof nps.WsMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {nps.WsMsg} WsMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WsMsg.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WsMsg message.
         * @function verify
         * @memberof nps.WsMsg
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WsMsg.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.data != null && message.hasOwnProperty("data")) {
                properties.enumof = 1;
                {
                    let error = $root.nps.WsData.verify(message.data);
                    if (error)
                        return "data." + error;
                }
            }
            if (message.resize != null && message.hasOwnProperty("resize")) {
                if (properties.enumof === 1)
                    return "enumof: multiple values";
                properties.enumof = 1;
                {
                    let error = $root.nps.WsResize.verify(message.resize);
                    if (error)
                        return "resize." + error;
                }
            }
            if (message.ping != null && message.hasOwnProperty("ping")) {
                if (properties.enumof === 1)
                    return "enumof: multiple values";
                properties.enumof = 1;
                {
                    let error = $root.nps.WsPing.verify(message.ping);
                    if (error)
                        return "ping." + error;
                }
            }
            return null;
        };

        /**
         * Creates a WsMsg message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof nps.WsMsg
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {nps.WsMsg} WsMsg
         */
        WsMsg.fromObject = function fromObject(object) {
            if (object instanceof $root.nps.WsMsg)
                return object;
            let message = new $root.nps.WsMsg();
            if (object.data != null) {
                if (typeof object.data !== "object")
                    throw TypeError(".nps.WsMsg.data: object expected");
                message.data = $root.nps.WsData.fromObject(object.data);
            }
            if (object.resize != null) {
                if (typeof object.resize !== "object")
                    throw TypeError(".nps.WsMsg.resize: object expected");
                message.resize = $root.nps.WsResize.fromObject(object.resize);
            }
            if (object.ping != null) {
                if (typeof object.ping !== "object")
                    throw TypeError(".nps.WsMsg.ping: object expected");
                message.ping = $root.nps.WsPing.fromObject(object.ping);
            }
            return message;
        };

        /**
         * Creates a plain object from a WsMsg message. Also converts values to other types if specified.
         * @function toObject
         * @memberof nps.WsMsg
         * @static
         * @param {nps.WsMsg} message WsMsg
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WsMsg.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.data != null && message.hasOwnProperty("data")) {
                object.data = $root.nps.WsData.toObject(message.data, options);
                if (options.oneofs)
                    object.enumof = "data";
            }
            if (message.resize != null && message.hasOwnProperty("resize")) {
                object.resize = $root.nps.WsResize.toObject(message.resize, options);
                if (options.oneofs)
                    object.enumof = "resize";
            }
            if (message.ping != null && message.hasOwnProperty("ping")) {
                object.ping = $root.nps.WsPing.toObject(message.ping, options);
                if (options.oneofs)
                    object.enumof = "ping";
            }
            return object;
        };

        /**
         * Converts this WsMsg to JSON.
         * @function toJSON
         * @memberof nps.WsMsg
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WsMsg.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return WsMsg;
    })();

    return nps;
})();

export { $root as default };
