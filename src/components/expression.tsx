import { useState } from "react"

type Expression = FunctionCall | Operation | Literal | Variable

type FunctionCall = {
	type: "function"
	name: string
	args: Expression[]
}

type Operation = {
	type: "operation"
	operator: string
	operands: Expression[]
}

type Literal = {
	type: "literal"
	value: string | number | boolean
	return: "string" | "number" | "boolean"
}

type Variable = {
	type: "variable"
	name: string
}

type EmptyExpression = {
	type: "empty"
}

type ExtendedExpression = Expression | EmptyExpression

const isUnaryOperator = (op: string) => ["!", "-", "+", "typeof"].includes(op)

const createEmptyExpression = (): EmptyExpression => ({ type: "empty" })

const createLiteral = (value: string | number | boolean): Literal => {
	const type = typeof value
	return {
		type: "literal",
		value,
		return: type as "string" | "number" | "boolean",
	}
}

const createVariable = (name: string): Variable => ({
	type: "variable",
	name,
})

const createOperation = (operator: string, operands: Expression[]): Operation => ({
	type: "operation",
	operator,
	operands,
})

const createFunction = (name: string, args: Expression[] = []): FunctionCall => ({
	type: "function",
	name,
	args,
})

type ExpressionNodeProp = {
	exp: ExtendedExpression
	onUpdate?: (newExp: Expression) => void
	onDelete: () => void
	path?: number[]
	editable?: boolean
}

type EmptyExpressionNodeProp = {
	onUpdate: (newExp: Expression) => void
}

function ExpressionNode({
	exp,
	onUpdate,
	onDelete,
	path = [],
	editable = false,
}: ExpressionNodeProp) {
	if (exp.type === "empty") {
		return <EmptyExpressionNode onUpdate={onUpdate!} />
	}

	const updateExpression = (newExp: Expression) => {
		if (onUpdate) onUpdate(newExp)
	}

	const props = { exp, onUpdate: updateExpression, onDelete, path, editable }

	switch (exp.type) {
		case "function": {
			return <FunctionExpressionNode {...props} exp={exp} />
		}
		case "operation": {
			return <OperationExpressionNode {...props} exp={exp} />
		}
		case "literal": {
			return <LiteralExpressionNode {...props} exp={exp} />
		}
		case "variable": {
			return <VariableExpressionNode {...props} exp={exp} />
		}
	}
}

function EmptyExpressionNode({ onUpdate }: EmptyExpressionNodeProp) {
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	const handleSelectType = (type: string) => {
		setIsMenuOpen(false)

		switch (type) {
			case "literal":
				onUpdate(createLiteral(""))
				break
			case "variable":
				onUpdate(createVariable("variable"))
				break
			case "operation":
				onUpdate(
					createOperation("+", [createEmptyExpression() as any, createEmptyExpression() as any])
				)
				break
			case "function":
				onUpdate(createFunction("function", []))
				break
		}
	}

	return (
		<div className="relative">
			<button
				onClick={() => setIsMenuOpen(!isMenuOpen)}
				className="rounded-md border border-dashed border-gray-400 bg-gray-50 px-4 py-2 text-gray-500 hover:bg-gray-100 flex items-center justify-center min-w-32"
			>
				<span className="text-sm">+ Add Expression</span>
			</button>

			{isMenuOpen && (
				<div className="absolute z-10 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
					<div className="py-1">
						<button
							onClick={() => handleSelectType("literal")}
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
						>
							Literal Value
						</button>
						<button
							onClick={() => handleSelectType("variable")}
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
						>
							Variable
						</button>
						<button
							onClick={() => handleSelectType("operation")}
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
						>
							Operation
						</button>
						<button
							onClick={() => handleSelectType("function")}
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
						>
							Function Call
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

function FunctionExpressionNode({
	exp,
	onUpdate,
	onDelete,
	path = [],
	editable = false,
}: ExpressionNodeProp & { exp: FunctionCall }) {
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [functionName, setFunctionName] = useState(exp.name)

	const handleNameSave = () => {
		if (onUpdate) {
			onUpdate({
				...exp,
				name: functionName,
			})
		}
		setIsEditing(false)
	}

	const handleArgUpdate = (index: number, newArg: Expression) => {
		if (onUpdate) {
			const newArgs = [...exp.args]
			newArgs[index] = newArg
			onUpdate({
				...exp,
				args: newArgs,
			})
		}
	}

	const handleArgDelete = (index: number) => {
		if (onUpdate) {
			const newArgs = exp.args.filter((_, i) => i !== index)
			onUpdate({
				...exp,
				args: newArgs,
			})
		}
	}

	const addArgument = () => {
		if (onUpdate) {
			onUpdate({
				...exp,
				args: [...exp.args, { type: "empty" } as any],
			})
		}
	}

	return (
		<div className="rounded-lg shadow-md bg-blue-50 border border-blue-300 relative">
			{editable && onDelete && (
				<button
					onClick={onDelete}
					className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-red-600 z-10"
					title="Delete function"
				>
					×
				</button>
			)}
			<div className="bg-blue-500 text-white px-3 py-2 flex justify-between items-center rounded-t-lg">
				{editable && isEditing ? (
					<div className="flex items-center">
						<input
							type="text"
							value={functionName}
							onChange={(e) => setFunctionName(e.target.value)}
							className="bg-blue-600 text-white px-2 py-1 rounded outline-none"
							autoFocus
							onBlur={handleNameSave}
							onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
						/>
						<span className="ml-1 font-bold">()</span>
					</div>
				) : (
					<div className="font-bold" onClick={() => editable && setIsEditing(true)}>
						{exp.name}()
					</div>
				)}
				<div className="flex items-center">
					{editable && (
						<button
							onClick={addArgument}
							className="text-xs text-blue-200 hover:text-white mr-2 px-1"
							title="Add argument"
						>
							+ Arg
						</button>
					)}
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="text-blue-100 hover:text-white"
						title={isCollapsed ? "Expand" : "Collapse"}
					>
						{isCollapsed ? "▼" : "▲"}
					</button>
				</div>
			</div>
			{!isCollapsed && (
				<div className="p-3">
					{exp.args.length === 0 ? (
						<div className="flex justify-between items-center">
							<div className="text-gray-500 italic text-sm">No arguments</div>
							{editable && (
								<button
									onClick={addArgument}
									className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
								>
									Add Argument
								</button>
							)}
						</div>
					) : (
						<div className="flex flex-col gap-2">
							{exp.args.map((arg, i) => (
								<div key={i} className="flex items-center gap-2">
									<div className="text-xs font-medium text-gray-500 w-6 text-right">{i + 1}:</div>
									<div className="flex-1">
										<ExpressionNode
											exp={arg}
											onUpdate={(newExp) => handleArgUpdate(i, newExp)}
											onDelete={() => handleArgDelete(i)}
											path={[...path, i]}
											editable={editable}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

function LiteralExpressionNode({
	exp,
	onUpdate,
	onDelete,
	editable = false,
}: ExpressionNodeProp & { exp: Literal }) {
	const [isEditing, setIsEditing] = useState(false)
	const [value, setValue] = useState(String(exp.value))
	const [type, setType] = useState<"string" | "number" | "boolean">(exp.return)

	// Color coding based on type
	const getBgColor = () => {
		switch (exp.return) {
			case "string":
				return "bg-green-50 border-green-300"
			case "number":
				return "bg-purple-50 border-purple-300"
			case "boolean":
				return "bg-yellow-50 border-yellow-300"
			default:
				return "bg-gray-50 border-gray-300"
		}
	}

	const getTextColor = () => {
		switch (exp.return) {
			case "string":
				return "text-green-700"
			case "number":
				return "text-purple-700"
			case "boolean":
				return "text-yellow-700"
			default:
				return "text-gray-700"
		}
	}

	const handleSave = () => {
		if (onUpdate) {
			let typedValue: string | number | boolean = value

			if (type === "number") {
				typedValue = Number(value)
			} else if (type === "boolean") {
				typedValue = value.toLowerCase() === "true"
			}

			onUpdate({
				type: "literal",
				value: typedValue,
				return: type,
			})
		}
		setIsEditing(false)
	}

	if (editable && isEditing) {
		return (
			<div className="rounded-md bg-white border border-gray-300 p-2 shadow-sm">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<label className="text-xs text-gray-500">Type:</label>
						<select
							value={type}
							onChange={(e) => setType(e.target.value as "string" | "number" | "boolean")}
							className="text-sm border rounded px-1 py-0.5"
						>
							<option value="string">String</option>
							<option value="number">Number</option>
							<option value="boolean">Boolean</option>
						</select>
					</div>

					{type === "boolean" ? (
						<select
							value={value}
							onChange={(e) => setValue(e.target.value)}
							className="border rounded px-2 py-1"
						>
							<option value="true">true</option>
							<option value="false">false</option>
						</select>
					) : (
						<input
							type={type === "number" ? "number" : "text"}
							value={value}
							onChange={(e) => setValue(e.target.value)}
							className="border rounded px-2 py-1"
							autoFocus
						/>
					)}

					<div className="flex justify-end gap-2 mt-1">
						<button
							onClick={() => setIsEditing(false)}
							className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
						>
							Save
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div
			className={`rounded-md ${getBgColor()} px-3 py-2 font-mono ${getTextColor()} shadow-sm relative`}
			onClick={() => editable && setIsEditing(true)}
		>
			{editable && onDelete && (
				<button
					onClick={(e) => {
						e.stopPropagation()
						onDelete()
					}}
					className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-red-600 z-10"
					title="Delete literal"
				>
					×
				</button>
			)}
			{exp.return === "string" ? `"${exp.value}"` : String(exp.value)}
		</div>
	)
}

function VariableExpressionNode({
	exp,
	onUpdate,
	onDelete,
	editable = false,
}: ExpressionNodeProp & { exp: Variable }) {
	const [isEditing, setIsEditing] = useState(false)
	const [variableName, setVariableName] = useState(exp.name)

	const handleSave = () => {
		if (onUpdate) {
			onUpdate({
				type: "variable",
				name: variableName,
			})
		}
		setIsEditing(false)
	}

	if (editable && isEditing) {
		return (
			<div className="rounded-md bg-white border border-indigo-300 p-2 shadow-sm">
				<div className="flex flex-col gap-2">
					<input
						type="text"
						value={variableName}
						onChange={(e) => setVariableName(e.target.value)}
						className="border rounded px-2 py-1"
						autoFocus
						placeholder="Variable name"
					/>

					<div className="flex justify-end gap-2 mt-1">
						<button
							onClick={() => setIsEditing(false)}
							className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
						>
							Save
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div
			className="rounded-md bg-indigo-50 border border-indigo-300 px-3 py-2 font-semibold text-indigo-700 shadow-sm relative"
			onClick={() => editable && setIsEditing(true)}
		>
			{editable && onDelete && (
				<button
					onClick={(e) => {
						e.stopPropagation()
						onDelete()
					}}
					className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-red-600 z-10"
					title="Delete variable"
				>
					×
				</button>
			)}
			{exp.name}
		</div>
	)
}

function OperationExpressionNode({
	exp,
	onUpdate,
	onDelete,
	path = [],
	editable = false,
}: ExpressionNodeProp & { exp: Operation }) {
	const [isEditing, setIsEditing] = useState(false)
	const [operator, setOperator] = useState(exp.operator)
	const isUnary = isUnaryOperator(exp.operator)

	const commonOperators = [
		"+",
		"-",
		"*",
		"/",
		"%",
		"==",
		"===",
		"!=",
		"!==",
		">",
		">=",
		"<",
		"<=",
		"&&",
		"||",
		"!",
	]

	const handleSave = () => {
		if (onUpdate) {
			// If changing between unary and binary operators, adjust operands
			const newIsUnary = isUnaryOperator(operator)
			let newOperands = [...exp.operands]

			if (isUnary && !newIsUnary) {
				// Going from unary to binary, add a placeholder
				newOperands.push({ type: "empty" } as any)
			} else if (!isUnary && newIsUnary) {
				// Going from binary to unary, remove second operand
				newOperands = [newOperands[0]]
			}

			onUpdate({
				...exp,
				operator,
				operands: newOperands,
			})
		}
		setIsEditing(false)
	}

	const handleOperandUpdate = (index: number, newOperand: Expression) => {
		if (onUpdate) {
			const newOperands = [...exp.operands]
			newOperands[index] = newOperand
			onUpdate({
				...exp,
				operands: newOperands,
			})
		}
	}

	const handleOperandDelete = (index: number) => {
		if (onUpdate) {
			const newOperands = exp.operands.splice(index)
			onUpdate({
				...exp,
				operands: newOperands,
			})
		}
	}

	if (editable && isEditing) {
		return (
			<div className="rounded-md bg-white border border-amber-300 p-3 shadow-sm">
				<div className="flex flex-col gap-2">
					<label className="text-xs text-gray-500">Operator:</label>
					<div className="flex gap-2 flex-wrap">
						{commonOperators.map((op) => (
							<button
								key={op}
								onClick={() => setOperator(op)}
								className={`px-2 py-1 rounded text-sm ${
									operator === op
										? "bg-amber-500 text-white"
										: "bg-amber-100 text-amber-800 hover:bg-amber-200"
								}`}
							>
								{op}
							</button>
						))}
						<input
							type="text"
							value={operator}
							onChange={(e) => setOperator(e.target.value)}
							className="border rounded px-2 py-1 text-sm flex-grow"
							placeholder="Custom operator"
						/>
					</div>

					<div className="flex justify-end gap-2 mt-2">
						<button
							onClick={() => setIsEditing(false)}
							className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
						>
							Save
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="rounded-lg shadow-md bg-amber-50 border border-amber-300 p-3 relative">
			{editable && onDelete && (
				<button
					onClick={onDelete}
					className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-red-600 z-10"
					title="Delete operation"
				>
					×
				</button>
			)}
			<div className="flex items-center gap-2">
				{isUnary ? (
					<>
						<div
							className="bg-amber-200 rounded-md px-2 py-1 font-mono text-amber-800"
							onClick={() => editable && setIsEditing(true)}
						>
							{exp.operator}
						</div>
						<div className="flex-1">
							<ExpressionNode
								exp={exp.operands[0]}
								onUpdate={(newExp) => handleOperandUpdate(0, newExp)}
								path={[...path, 0]}
								onDelete={() => handleOperandDelete(0)}
								editable={editable}
							/>
						</div>
					</>
				) : (
					<div className="flex flex-col md:flex-row items-center gap-2 w-full">
						<div className="md:flex-1 w-full">
							<ExpressionNode
								exp={exp.operands[0]}
								onUpdate={(newExp) => handleOperandUpdate(0, newExp)}
								onDelete={() => handleOperandDelete(0)}
								path={[...path, 0]}
								editable={editable}
							/>
						</div>
						<div
							className="bg-amber-200 rounded-md px-2 py-1 font-mono text-amber-800 my-1"
							onClick={() => editable && setIsEditing(true)}
						>
							{exp.operator}
						</div>
						<div className="md:flex-1 w-full">
							<ExpressionNode
								exp={exp.operands[1]}
								onUpdate={(newExp) => handleOperandUpdate(1, newExp)}
								onDelete={() => handleOperandDelete(1)}
								path={[...path, 1]}
								editable={editable}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

function ExpressionBuilder() {
	const [rootExpression, setRootExpression] = useState<ExtendedExpression>({ type: "empty" })
	const [jsonView, setJsonView] = useState(false)

	const handleExpressionUpdate = (newExp: Expression) => {
		setRootExpression(newExp)
	}

	const handleExpressionDelete = () => {
		setRootExpression(createEmptyExpression())
	}

	return (
		<div className="p-4 bg-white rounded-lg shadow">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold text-gray-800">Expression Builder</h2>
				<button
					onClick={() => setJsonView(!jsonView)}
					className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
				>
					{jsonView ? "View Expression" : "View JSON"}
				</button>
			</div>

			{jsonView ? (
				<div className="bg-gray-50 p-3 rounded-md border border-gray-200 overflow-auto max-h-96">
					<pre className="text-sm text-gray-800 whitespace-pre-wrap">
						{JSON.stringify(rootExpression, null, 2)}
					</pre>
				</div>
			) : (
				<div className="mb-4">
					<ExpressionNode
						exp={rootExpression}
						onUpdate={handleExpressionUpdate}
						editable={true}
						onDelete={handleExpressionDelete}
					/>
				</div>
			)}
		</div>
	)
}

export default function ExpressionTreeDemo() {
	const exampleExpression: FunctionCall = createFunction("avg", [
		createOperation("+", [createVariable("price"), createLiteral(10)]),
		createOperation("!", [createLiteral(false)]),
		createLiteral("product"),
	])

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Expression Tree System</h1>

			{/* Viewer Section */}
			<div className="mb-8">
				<h2 className="text-xl font-bold mb-4 text-gray-700">Example Viewer</h2>
				<div className="p-4 bg-white rounded-lg shadow">
					<ExpressionNode exp={exampleExpression} onDelete={() => {}} />
				</div>
			</div>

			{/* Builder Section */}
			<div className="mb-8">
				<h2 className="text-xl font-bold mb-4 text-gray-700">Build Your Own Expression</h2>
				<ExpressionBuilder />
			</div>
		</div>
	)
}
