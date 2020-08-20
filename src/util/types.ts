import { LinePos } from 'yaml/util';

export interface Action {
  parameter: string;
  pre?: string;
  post?: string;
}

export interface Delta {
  js: number;
  md: number;
}

export interface Position {
  start: LinePos;
  end: LinePos;
}

export interface Block {
  jobId: string;
  index: number;
  value: string;
  lines: string[];
  pre: string;
  post: string;
  indent: number;
  linePos: Position;
  posMap: Delta[];
}

export interface ESLintBlock {
  filename: string;
  text: string;
}
