import {Future} from "../../src";
import {expect} from "chai";

export const expectFuture = (future: Future<any>, expected: any) => expect(future.resolve()).to.deep.equal(expected)
