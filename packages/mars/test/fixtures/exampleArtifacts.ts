/* eslint-disable */
import * as Mars from "../../src";

const ComplexContract__JSON = require("./../build/ComplexContract.json");
const ReservedContract__JSON = require("./../build/ReservedContract.json");
const SimpleContract__JSON = require("./../build/SimpleContract.json");

export const ComplexContract = Mars.createArtifact<{
  new(_: Mars.NumberLike, __: Mars.StringLike): void;
  add(a: Mars.NumberLike): Mars.FutureNumber;
  complexMapping(_: Mars.NumberLike, __: Mars.AddressLike): Mars.Future<[Mars.FutureNumber, Mars.FutureNumber]>;
  number(): Mars.FutureNumber;
  setter(arg1: Mars.StringLike, arg2: Mars.MaybeFuture<Mars.NumberLike[]>, options?: Mars.TransactionOverrides): Mars.Transaction;
  simpleArray(_: Mars.NumberLike): Mars.FutureNumber;
  simpleMapping(_: Mars.NumberLike): Mars.Future<string>;
  str(): Mars.Future<string>;
  twoDArray(_: Mars.NumberLike, __: Mars.NumberLike): Mars.FutureNumber;
  viewNoArgs(): Mars.FutureNumber;
  viewReturnsStruct(): Mars.Future<{a: Mars.FutureNumber, b: Mars.FutureNumber, c: Mars.Future<Mars.Future<{x: Mars.FutureNumber, y: Mars.FutureNumber}>[]>}>;
  viewReturnsTuple(): Mars.Future<[Mars.FutureNumber, Mars.Future<string>, Mars.FutureBoolean]>;
}>("ComplexContract", ComplexContract__JSON);

export const ReservedContract = Mars.createArtifact<{
  new(): void;
  foo(_package: Mars.NumberLike, options?: Mars.TransactionOverrides): Mars.Transaction;
}>("ReservedContract", ReservedContract__JSON);

export const SimpleContract = Mars.createArtifact<{
  new(): void;
  hello(): Mars.Future<string>;
}>("SimpleContract", SimpleContract__JSON);
