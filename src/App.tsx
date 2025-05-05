import ExpressionTreeDemo from "./components/expression"

type DataType = "number" | "string" | "boolean"

type BooleanOperators = ">" | ">=" | "<" | "<=" | "==" | "!=" | "and" | "or"

type ArithmeticOperators = "+" | "-" | "*" | "/"

type OperationOperator = BooleanOperators | ArithmeticOperators

type Expression<T extends DataType = DataType> =
	| FunctionCall<T>
	| Operation<T>
	| Literal<T>
	| Variable<T>

type FunctionCall<T extends DataType = DataType> = {
	type: "function"
	name: string
	args: Expression[]
	return: T
}

type LiteralValue<T extends DataType = DataType> = T extends "number"
	? number
	: T extends "string"
	? string
	: T extends "boolean"
	? boolean
	: never

type Literal<T extends DataType = DataType> = {
	type: "literal"
	value: LiteralValue<T>
	return: T
}

type Variable<T extends DataType = DataType> = {
	type: "variable"
	name: string
	return: T
}

type OperandReturn<T extends Expression[]> = T extends [infer First, ...any[]]
	? First extends Expression
		? First["return"]
		: never
	: never

type Operation<T extends DataType = DataType, O extends OperationOperator = OperationOperator> = {
	type: "operation"
	operator: O
	return: O extends BooleanOperators
		? T extends "boolean"
			? "boolean"
			: never
		: T extends OperandReturn<Operation["operands"]>
		? T
		: never
	operands: O extends BooleanOperators ? Expression<"boolean">[] : Expression<"number">[]
}

type RuleExpression = {
	id: string
	priority: number
	source: string
	tree: Expression
}

function isUnaryOperator(operator: OperationOperator): boolean {
	return operator === "-"
}

function isArithmeticOperator(operator: OperationOperator): operator is ArithmeticOperators {
	return ["+", "-", "*", "/"].includes(operator)
}

function isBooleanOperator(operator: OperationOperator): operator is BooleanOperators {
	return !isArithmeticOperator(operator)
}

function buildSource(e: Expression): string {
	switch (e.type) {
		case "function": {
			const args = e.args.map(buildSource)
			return `${e.name}(${args.join(", ")})`
		}

		case "literal": {
			const value = e.value

			if (typeof value === "string") {
				return `"${value}"`
			}

			if (typeof value === "number") {
				return e.value.toString()
			}

			const form = e.value.toString()
			return form[0].toUpperCase() + form.substring(1)
		}

		case "operation": {
			const operands = e.operands.slice(0, 2).map(buildSource)

			const isUnary = isUnaryOperator(e.operator)

			if (isUnary) {
				console.assert(operands.length === 1, "Unary operation requires one operand")
				return `(${e.operator}${operands[0]})`
			}
			console.assert(operands.length === 2, "Binary operation requires two operands")
			return `(${operands.join(" " + e.operator + " ")})`
		}

		case "variable": {
			return e.name
		}

		default: {
			throw new Error("Invalid expression type")
		}
	}
}

function buildRuleExpression(
	e: Expression,
	{ id, priority }: { id: string; priority: number }
): RuleExpression {
	return {
		id,
		priority,
		source: buildSource(e),
		tree: e,
	}
}

// helper functions for building expression

function createLiteral<T extends DataType>(value: LiteralValue<T>, returnType: T): Literal<T> {
	return {
		type: "literal",
		value,
		return: returnType,
	}
}

function createVariable<T extends DataType>(name: string, returnType: T): Variable<T> {
	return {
		type: "variable",
		name,
		return: returnType,
	}
}

function createFunction<T extends DataType>(
	name: string,
	args: Expression[],
	returnType: T
): FunctionCall<T> {
	return {
		type: "function",
		name,
		args,
		return: returnType,
	}
}

type CreateOperationOperands<T extends OperationOperator> = T extends BooleanOperators
	? Expression<"boolean">[]
	: Expression<"number">[]

function createOperation<
	O extends OperationOperator,
	T extends DataType = O extends BooleanOperators ? "boolean" : "number"
>(operator: O, operands: CreateOperationOperands<O>): Operation<T, O> {
	return {
		type: "operation",
		operator,
		operands,
		return: isBooleanOperator(operator) ? "boolean" : ("number" as any),
	}
}

function App() {
	return <ExpressionTreeDemo />
}

export default App
