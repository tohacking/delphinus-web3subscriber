"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SS58toBN = exports.toSS58 = exports.toDecStr = exports.toHexStr = exports.decodeL1address = exports.encodeL1address = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const { addressIdToAddress, addressToAddressId } = require("substrate-ss58");
const L1ADDR_BITS = 160;
function encodeL1address(addressHex, chex) {
    let c = new bn_js_1.default(chex + "0000000000000000000000000000000000000000", "hex");
    let a = new bn_js_1.default(addressHex, 16);
    return c.add(a);
}
exports.encodeL1address = encodeL1address;
/* chain_id:dec * address:hex
 */
function decodeL1address(l1address) {
    let uid = new bn_js_1.default(l1address);
    let chainId = uid.shrn(L1ADDR_BITS);
    let addressHex = uid.sub(chainId.shln(L1ADDR_BITS)).toString(16);
    //address is 160 thus we need to padding '0' at the begining
    let prefix = Array(40 - addressHex.length + 1).join("0");
    addressHex = prefix + addressHex;
    let chainHex = chainId.toString(10);
    return [chainHex, addressHex];
}
exports.decodeL1address = decodeL1address;
function toHexStr(a) {
    let c = new bn_js_1.default(a);
    return "0x" + c.toString(16);
}
exports.toHexStr = toHexStr;
function toDecStr(a) {
    let c = new bn_js_1.default(a);
    return c.toString(10);
}
exports.toDecStr = toDecStr;
function toSS58(bn) {
    let hexStr = new bn_js_1.default(bn).toString(16);
    let r = "";
    for (let i = 0; i < 64 - hexStr.length; i++) {
        r += "0";
    }
    r = r + hexStr;
    return addressIdToAddress(r);
}
exports.toSS58 = toSS58;
function SS58toBN(ss58) {
    let hex = addressToAddressId(ss58);
    return new bn_js_1.default(hex.substring(2), "hex");
}
exports.SS58toBN = SS58toBN;
//# sourceMappingURL=addresses.js.map