var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-YlftPU/functionsWorker-0.8298376364780342.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __export = /* @__PURE__ */ __name((target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
}, "__export");
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
__name(is, "is");
__name2(is, "is");
var ConsoleLogWriter = class {
  static {
    __name(this, "ConsoleLogWriter");
  }
  static {
    __name2(this, "ConsoleLogWriter");
  }
  static [entityKind] = "ConsoleLogWriter";
  write(message2) {
    console.log(message2);
  }
};
var DefaultLogger = class {
  static {
    __name(this, "DefaultLogger");
  }
  static {
    __name2(this, "DefaultLogger");
  }
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static {
    __name(this, "NoopLogger");
  }
  static {
    __name2(this, "NoopLogger");
  }
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static {
    __name(this, "Table");
  }
  static {
    __name2(this, "Table");
  }
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
__name(getTableName, "getTableName");
__name2(getTableName, "getTableName");
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}
__name(getTableUniqueName, "getTableUniqueName");
__name2(getTableUniqueName, "getTableUniqueName");
var Column = class {
  static {
    __name(this, "Column");
  }
  static {
    __name2(this, "Column");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};
var ColumnBuilder = class {
  static {
    __name(this, "ColumnBuilder");
  }
  static {
    __name2(this, "ColumnBuilder");
  }
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};
var ForeignKeyBuilder = class {
  static {
    __name(this, "ForeignKeyBuilder");
  }
  static {
    __name2(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  static {
    __name(this, "ForeignKey");
  }
  static {
    __name2(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};
function iife(fn, ...args) {
  return fn(...args);
}
__name(iife, "iife");
__name2(iife, "iife");
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName, "uniqueKeyName");
__name2(uniqueKeyName, "uniqueKeyName");
var UniqueConstraintBuilder = class {
  static {
    __name(this, "UniqueConstraintBuilder");
  }
  static {
    __name2(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static {
    __name(this, "UniqueOnConstraintBuilder");
  }
  static {
    __name2(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  static {
    __name(this, "UniqueConstraint");
  }
  static {
    __name2(this, "UniqueConstraint");
  }
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
__name(parsePgArrayValue, "parsePgArrayValue");
__name2(parsePgArrayValue, "parsePgArrayValue");
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
__name(parsePgNestedArray, "parsePgNestedArray");
__name2(parsePgNestedArray, "parsePgNestedArray");
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
__name(parsePgArray, "parsePgArray");
__name2(parsePgArray, "parsePgArray");
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}
__name(makePgArray, "makePgArray");
__name2(makePgArray, "makePgArray");
var PgColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "PgColumnBuilder");
  }
  static {
    __name2(this, "PgColumnBuilder");
  }
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  static {
    __name(this, "PgColumn");
  }
  static {
    __name2(this, "PgColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static {
    __name(this, "ExtraConfigColumn");
  }
  static {
    __name2(this, "ExtraConfigColumn");
  }
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static {
    __name(this, "IndexedColumn");
  }
  static {
    __name2(this, "IndexedColumn");
  }
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgArrayBuilder");
  }
  static {
    __name2(this, "PgArrayBuilder");
  }
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  static {
    __name(this, "_PgArray");
  }
  static {
    __name2(this, "PgArray");
  }
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgEnumObjectColumnBuilder");
  }
  static {
    __name2(this, "PgEnumObjectColumnBuilder");
  }
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static {
    __name(this, "PgEnumObjectColumn");
  }
  static {
    __name2(this, "PgEnumObjectColumn");
  }
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
__name(isPgEnum, "isPgEnum");
__name2(isPgEnum, "isPgEnum");
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgEnumColumnBuilder");
  }
  static {
    __name2(this, "PgEnumColumnBuilder");
  }
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static {
    __name(this, "PgEnumColumn");
  }
  static {
    __name2(this, "PgEnumColumn");
  }
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var Subquery = class {
  static {
    __name(this, "Subquery");
  }
  static {
    __name2(this, "Subquery");
  }
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static {
    __name(this, "WithSubquery");
  }
  static {
    __name2(this, "WithSubquery");
  }
  static [entityKind] = "WithSubquery";
};
var version = "0.45.2";
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");
var FakePrimitiveParam = class {
  static {
    __name(this, "FakePrimitiveParam");
  }
  static {
    __name2(this, "FakePrimitiveParam");
  }
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
__name(isSQLWrapper, "isSQLWrapper");
__name2(isSQLWrapper, "isSQLWrapper");
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
__name(mergeQueries, "mergeQueries");
__name2(mergeQueries, "mergeQueries");
var StringChunk = class {
  static {
    __name(this, "StringChunk");
  }
  static {
    __name2(this, "StringChunk");
  }
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  static {
    __name(this, "_SQL");
  }
  static {
    __name2(this, "SQL");
  }
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString: escapeString2 }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString2(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString2(JSON.stringify(chunk));
      }
      return escapeString2(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder2) {
    this.decoder = typeof decoder2 === "function" ? { mapFromDriverValue: decoder2 } : decoder2;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  static {
    __name(this, "Name");
  }
  static {
    __name2(this, "Name");
  }
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
__name(isDriverValueEncoder, "isDriverValueEncoder");
__name2(isDriverValueEncoder, "isDriverValueEncoder");
var noopDecoder = {
  mapFromDriverValue: /* @__PURE__ */ __name2((value) => value, "mapFromDriverValue")
};
var noopEncoder = {
  mapToDriverValue: /* @__PURE__ */ __name2((value) => value, "mapToDriverValue")
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  static {
    __name(this, "Param");
  }
  static {
    __name2(this, "Param");
  }
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder2 = noopEncoder) {
    this.value = value;
    this.encoder = encoder2;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
__name(sql, "sql");
__name2(sql, "sql");
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  __name(empty, "empty");
  __name2(empty, "empty");
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  __name(fromList, "fromList");
  __name2(fromList, "fromList");
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  __name(raw, "raw");
  __name2(raw, "raw");
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  __name(join, "join");
  __name2(join, "join");
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  __name(identifier, "identifier");
  __name2(identifier, "identifier");
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  __name(placeholder2, "placeholder2");
  __name2(placeholder2, "placeholder2");
  sql2.placeholder = placeholder2;
  function param2(value, encoder2) {
    return new Param(value, encoder2);
  }
  __name(param2, "param2");
  __name2(param2, "param2");
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    static {
      __name(this, "Aliased");
    }
    static {
      __name2(this, "Aliased");
    }
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  static {
    __name(this, "Placeholder");
  }
  static {
    __name2(this, "Placeholder");
  }
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
__name(fillPlaceholders, "fillPlaceholders");
__name2(fillPlaceholders, "fillPlaceholders");
var IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static {
    __name(this, "View");
  }
  static {
    __name2(this, "View");
  }
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder2;
      if (is(field, Column)) {
        decoder2 = field;
      } else if (is(field, SQL)) {
        decoder2 = field.decoder;
      } else if (is(field, Subquery)) {
        decoder2 = field._.sql.decoder;
      } else {
        decoder2 = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder2.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
__name(mapResultRow, "mapResultRow");
__name2(mapResultRow, "mapResultRow");
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
__name(orderSelectedFields, "orderSelectedFields");
__name2(orderSelectedFields, "orderSelectedFields");
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
__name(haveSameKeys, "haveSameKeys");
__name2(haveSameKeys, "haveSameKeys");
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
__name(mapUpdateSet, "mapUpdateSet");
__name2(mapUpdateSet, "mapUpdateSet");
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
__name(applyMixins, "applyMixins");
__name2(applyMixins, "applyMixins");
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
__name(getTableColumns, "getTableColumns");
__name2(getTableColumns, "getTableColumns");
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
__name(getTableLikeName, "getTableLikeName");
__name2(getTableLikeName, "getTableLikeName");
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
__name(getColumnNameAndConfig, "getColumnNameAndConfig");
__name2(getColumnNameAndConfig, "getColumnNameAndConfig");
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();
var InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static {
    __name(this, "PgTable");
  }
  static {
    __name2(this, "PgTable");
  }
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};
var PrimaryKeyBuilder = class {
  static {
    __name(this, "PrimaryKeyBuilder");
  }
  static {
    __name2(this, "PrimaryKeyBuilder");
  }
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  static {
    __name(this, "PrimaryKey");
  }
  static {
    __name2(this, "PrimaryKey");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
__name(bindIfParam, "bindIfParam");
__name2(bindIfParam, "bindIfParam");
var eq = /* @__PURE__ */ __name2((left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
}, "eq");
var ne = /* @__PURE__ */ __name2((left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
}, "ne");
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
__name(and, "and");
__name2(and, "and");
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
__name(or, "or");
__name2(or, "or");
function not(condition) {
  return sql`not ${condition}`;
}
__name(not, "not");
__name2(not, "not");
var gt = /* @__PURE__ */ __name2((left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
}, "gt");
var gte = /* @__PURE__ */ __name2((left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
}, "gte");
var lt = /* @__PURE__ */ __name2((left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
}, "lt");
var lte = /* @__PURE__ */ __name2((left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
}, "lte");
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
__name(inArray, "inArray");
__name2(inArray, "inArray");
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
__name(notInArray, "notInArray");
__name2(notInArray, "notInArray");
function isNull(value) {
  return sql`${value} is null`;
}
__name(isNull, "isNull");
__name2(isNull, "isNull");
function isNotNull(value) {
  return sql`${value} is not null`;
}
__name(isNotNull, "isNotNull");
__name2(isNotNull, "isNotNull");
function exists(subquery) {
  return sql`exists ${subquery}`;
}
__name(exists, "exists");
__name2(exists, "exists");
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
__name(notExists, "notExists");
__name2(notExists, "notExists");
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
__name(between, "between");
__name2(between, "between");
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
__name(notBetween, "notBetween");
__name2(notBetween, "notBetween");
function like(column, value) {
  return sql`${column} like ${value}`;
}
__name(like, "like");
__name2(like, "like");
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
__name(notLike, "notLike");
__name2(notLike, "notLike");
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
__name(ilike, "ilike");
__name2(ilike, "ilike");
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}
__name(notIlike, "notIlike");
__name2(notIlike, "notIlike");
function asc(column) {
  return sql`${column} asc`;
}
__name(asc, "asc");
__name2(asc, "asc");
function desc(column) {
  return sql`${column} desc`;
}
__name(desc, "desc");
__name2(desc, "desc");
var Relation = class {
  static {
    __name(this, "Relation");
  }
  static {
    __name2(this, "Relation");
  }
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  static {
    __name(this, "Relations");
  }
  static {
    __name2(this, "Relations");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  static {
    __name(this, "_One");
  }
  static {
    __name2(this, "One");
  }
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  static {
    __name(this, "_Many");
  }
  static {
    __name2(this, "Many");
  }
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
__name(getOperators, "getOperators");
__name2(getOperators, "getOperators");
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
__name(getOrderByOperators, "getOrderByOperators");
__name2(getOrderByOperators, "getOrderByOperators");
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
__name(extractTablesRelationalConfig, "extractTablesRelationalConfig");
__name2(extractTablesRelationalConfig, "extractTablesRelationalConfig");
function createOne(sourceTable) {
  return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  }, "one"), "one");
}
__name(createOne, "createOne");
__name2(createOne, "createOne");
function createMany(sourceTable) {
  return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  }, "many"), "many");
}
__name(createMany, "createMany");
__name2(createMany, "createMany");
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
__name(normalizeRelation, "normalizeRelation");
__name2(normalizeRelation, "normalizeRelation");
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
__name(createTableRelationsHelpers, "createTableRelationsHelpers");
__name2(createTableRelationsHelpers, "createTableRelationsHelpers");
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder2;
      if (is(field, Column)) {
        decoder2 = field;
      } else if (is(field, SQL)) {
        decoder2 = field.decoder;
      } else {
        decoder2 = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder2.mapFromDriverValue(value);
    }
  }
  return result;
}
__name(mapRelationalRow, "mapRelationalRow");
__name2(mapRelationalRow, "mapRelationalRow");
var ColumnAliasProxyHandler = class {
  static {
    __name(this, "ColumnAliasProxyHandler");
  }
  static {
    __name2(this, "ColumnAliasProxyHandler");
  }
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  static {
    __name(this, "TableAliasProxyHandler");
  }
  static {
    __name2(this, "TableAliasProxyHandler");
  }
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  static {
    __name(this, "RelationTableAliasProxyHandler");
  }
  static {
    __name2(this, "RelationTableAliasProxyHandler");
  }
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
__name(aliasedTable, "aliasedTable");
__name2(aliasedTable, "aliasedTable");
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
__name(aliasedTableColumn, "aliasedTableColumn");
__name2(aliasedTableColumn, "aliasedTableColumn");
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
__name(mapColumnsInAliasedSQLToAlias, "mapColumnsInAliasedSQLToAlias");
__name2(mapColumnsInAliasedSQLToAlias, "mapColumnsInAliasedSQLToAlias");
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}
__name(mapColumnsInSQLToAlias, "mapColumnsInSQLToAlias");
__name2(mapColumnsInSQLToAlias, "mapColumnsInSQLToAlias");
var SelectionProxyHandler = class _SelectionProxyHandler {
  static {
    __name(this, "_SelectionProxyHandler");
  }
  static {
    __name2(this, "SelectionProxyHandler");
  }
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};
var QueryPromise = class {
  static {
    __name(this, "QueryPromise");
  }
  static {
    __name2(this, "QueryPromise");
  }
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};
var ForeignKeyBuilder2 = class {
  static {
    __name(this, "ForeignKeyBuilder2");
  }
  static {
    __name2(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey2(table, this);
  }
};
var ForeignKey2 = class {
  static {
    __name(this, "ForeignKey2");
  }
  static {
    __name2(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName2, "uniqueKeyName2");
__name2(uniqueKeyName2, "uniqueKeyName");
var UniqueConstraintBuilder2 = class {
  static {
    __name(this, "UniqueConstraintBuilder2");
  }
  static {
    __name2(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "SQLiteUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint2(table, this.columns, this.name);
  }
};
var UniqueOnConstraintBuilder2 = class {
  static {
    __name(this, "UniqueOnConstraintBuilder2");
  }
  static {
    __name2(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "SQLiteUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder2(columns, this.name);
  }
};
var UniqueConstraint2 = class {
  static {
    __name(this, "UniqueConstraint2");
  }
  static {
    __name2(this, "UniqueConstraint");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
  }
  static [entityKind] = "SQLiteUniqueConstraint";
  columns;
  name;
  getName() {
    return this.name;
  }
};
var SQLiteColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "SQLiteColumnBuilder");
  }
  static {
    __name2(this, "SQLiteColumnBuilder");
  }
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder2(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
};
var SQLiteColumn = class extends Column {
  static {
    __name(this, "SQLiteColumn");
  }
  static {
    __name2(this, "SQLiteColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName2(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
};
var SQLiteBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBigIntBuilder");
  }
  static {
    __name2(this, "SQLiteBigIntBuilder");
  }
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
};
var SQLiteBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBigInt");
  }
  static {
    __name2(this, "SQLiteBigInt");
  }
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
};
var SQLiteBlobJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobJsonBuilder");
  }
  static {
    __name2(this, "SQLiteBlobJsonBuilder");
  }
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
};
var SQLiteBlobJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobJson");
  }
  static {
    __name2(this, "SQLiteBlobJson");
  }
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
};
var SQLiteBlobBufferBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobBufferBuilder");
  }
  static {
    __name2(this, "SQLiteBlobBufferBuilder");
  }
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
};
var SQLiteBlobBuffer = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobBuffer");
  }
  static {
    __name2(this, "SQLiteBlobBuffer");
  }
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
};
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}
__name(blob, "blob");
__name2(blob, "blob");
var SQLiteCustomColumnBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteCustomColumnBuilder");
  }
  static {
    __name2(this, "SQLiteCustomColumnBuilder");
  }
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
};
var SQLiteCustomColumn = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteCustomColumn");
  }
  static {
    __name2(this, "SQLiteCustomColumn");
  }
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}
__name(customType, "customType");
__name2(customType, "customType");
var SQLiteBaseIntegerBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBaseIntegerBuilder");
  }
  static {
    __name2(this, "SQLiteBaseIntegerBuilder");
  }
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
};
var SQLiteBaseInteger = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBaseInteger");
  }
  static {
    __name2(this, "SQLiteBaseInteger");
  }
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
};
var SQLiteIntegerBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteIntegerBuilder");
  }
  static {
    __name2(this, "SQLiteIntegerBuilder");
  }
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
};
var SQLiteInteger = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteInteger");
  }
  static {
    __name2(this, "SQLiteInteger");
  }
  static [entityKind] = "SQLiteInteger";
};
var SQLiteTimestampBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteTimestampBuilder");
  }
  static {
    __name2(this, "SQLiteTimestampBuilder");
  }
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
};
var SQLiteTimestamp = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteTimestamp");
  }
  static {
    __name2(this, "SQLiteTimestamp");
  }
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
};
var SQLiteBooleanBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteBooleanBuilder");
  }
  static {
    __name2(this, "SQLiteBooleanBuilder");
  }
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
};
var SQLiteBoolean = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteBoolean");
  }
  static {
    __name2(this, "SQLiteBoolean");
  }
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
};
function integer(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
__name(integer, "integer");
__name2(integer, "integer");
var SQLiteNumericBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBuilder");
  }
  static {
    __name2(this, "SQLiteNumericBuilder");
  }
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
};
var SQLiteNumeric = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumeric");
  }
  static {
    __name2(this, "SQLiteNumeric");
  }
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericNumberBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericNumberBuilder");
  }
  static {
    __name2(this, "SQLiteNumericNumberBuilder");
  }
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
};
var SQLiteNumericNumber = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericNumber");
  }
  static {
    __name2(this, "SQLiteNumericNumber");
  }
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBigIntBuilder");
  }
  static {
    __name2(this, "SQLiteNumericBigIntBuilder");
  }
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
};
var SQLiteNumericBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericBigInt");
  }
  static {
    __name2(this, "SQLiteNumericBigInt");
  }
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}
__name(numeric, "numeric");
__name2(numeric, "numeric");
var SQLiteRealBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteRealBuilder");
  }
  static {
    __name2(this, "SQLiteRealBuilder");
  }
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
};
var SQLiteReal = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteReal");
  }
  static {
    __name2(this, "SQLiteReal");
  }
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
};
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}
__name(real, "real");
__name2(real, "real");
var SQLiteTextBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextBuilder");
  }
  static {
    __name2(this, "SQLiteTextBuilder");
  }
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
};
var SQLiteText = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteText");
  }
  static {
    __name2(this, "SQLiteText");
  }
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
};
var SQLiteTextJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextJsonBuilder");
  }
  static {
    __name2(this, "SQLiteTextJsonBuilder");
  }
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
};
var SQLiteTextJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteTextJson");
  }
  static {
    __name2(this, "SQLiteTextJson");
  }
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
};
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}
__name(text, "text");
__name2(text, "text");
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text
  };
}
__name(getSQLiteColumnBuilders, "getSQLiteColumnBuilders");
__name2(getSQLiteColumnBuilders, "getSQLiteColumnBuilders");
var InlineForeignKeys2 = /* @__PURE__ */ Symbol.for("drizzle:SQLiteInlineForeignKeys");
var SQLiteTable = class extends Table {
  static {
    __name(this, "SQLiteTable");
  }
  static {
    __name2(this, "SQLiteTable");
  }
  static [entityKind] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys: InlineForeignKeys2
  });
  /** @internal */
  [Table.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys2] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys2].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
__name(sqliteTableBase, "sqliteTableBase");
__name2(sqliteTableBase, "sqliteTableBase");
var sqliteTable = /* @__PURE__ */ __name2((name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
}, "sqliteTable");
var IndexBuilderOn = class {
  static {
    __name(this, "IndexBuilderOn");
  }
  static {
    __name2(this, "IndexBuilderOn");
  }
  constructor(name, unique) {
    this.name = name;
    this.unique = unique;
  }
  static [entityKind] = "SQLiteIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(this.name, columns, this.unique);
  }
};
var IndexBuilder = class {
  static {
    __name(this, "IndexBuilder");
  }
  static {
    __name2(this, "IndexBuilder");
  }
  static [entityKind] = "SQLiteIndexBuilder";
  /** @internal */
  config;
  constructor(name, columns, unique) {
    this.config = {
      name,
      columns,
      unique,
      where: void 0
    };
  }
  /**
   * Condition for partial index.
   */
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
};
var Index = class {
  static {
    __name(this, "Index");
  }
  static {
    __name2(this, "Index");
  }
  static [entityKind] = "SQLiteIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
};
function uniqueIndex(name) {
  return new IndexBuilderOn(name, true);
}
__name(uniqueIndex, "uniqueIndex");
__name2(uniqueIndex, "uniqueIndex");
function extractUsedTable(table) {
  if (is(table, SQLiteTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}
__name(extractUsedTable, "extractUsedTable");
__name2(extractUsedTable, "extractUsedTable");
var SQLiteDeleteBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteDeleteBase");
  }
  static {
    __name2(this, "SQLiteDeleteBase");
  }
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "SQLiteDelete";
  /** @internal */
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
};
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
__name(toSnakeCase, "toSnakeCase");
__name2(toSnakeCase, "toSnakeCase");
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
__name(toCamelCase, "toCamelCase");
__name2(toCamelCase, "toCamelCase");
function noopCase(input) {
  return input;
}
__name(noopCase, "noopCase");
__name2(noopCase, "noopCase");
var CasingCache = class {
  static {
    __name(this, "CasingCache");
  }
  static {
    __name2(this, "CasingCache");
  }
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};
var DrizzleError = class extends Error {
  static {
    __name(this, "DrizzleError");
  }
  static {
    __name2(this, "DrizzleError");
  }
  static [entityKind] = "DrizzleError";
  constructor({ message: message2, cause }) {
    super(message2);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var DrizzleQueryError = class _DrizzleQueryError extends Error {
  static {
    __name(this, "_DrizzleQueryError");
  }
  static {
    __name2(this, "DrizzleQueryError");
  }
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, _DrizzleQueryError);
    if (cause) this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static {
    __name(this, "TransactionRollbackError");
  }
  static {
    __name2(this, "TransactionRollbackError");
  }
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};
var SQLiteViewBase = class extends View {
  static {
    __name(this, "SQLiteViewBase");
  }
  static {
    __name2(this, "SQLiteViewBase");
  }
  static [entityKind] = "SQLiteViewBase";
};
var SQLiteDialect = class {
  static {
    __name(this, "SQLiteDialect");
  }
  static {
    __name2(this, "SQLiteDialect");
  }
  static [entityKind] = "SQLiteDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  escapeName(name) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  escapeParam(_num) {
    return "?";
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({
    table,
    where,
    returning,
    withList,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(
      columnNames.flatMap((colName, i) => {
        const col = tableColumns[colName];
        const onUpdateFnResult = col.onUpdateFn?.();
        const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
        const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
        if (i < setSize - 1) {
          return [res, sql.raw(", ")];
        }
        return [res];
      })
    );
  }
  buildUpdateQuery({
    table,
    set,
    where,
    returning,
    withList,
    joins,
    from,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, Column)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        const tableName = field.table[Table.Symbol.Name];
        if (field.columnType === "SQLiteNumericBigInt") {
          if (isSingleTable) {
            chunk.push(
              sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          } else {
            chunk.push(
              sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          }
        } else {
          if (isSingleTable) {
            chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
          } else {
            chunk.push(
              sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`
            );
          }
        }
      } else if (is(field, Subquery)) {
        const entries = Object.entries(field._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: /* @__PURE__ */ __name2((v) => entry.mapFromDriverValue(v), "mapFromDriverValue") } : entry.sql.decoder;
          if (fieldDecoder) field._.sql.decoder = fieldDecoder;
        }
        chunk.push(field);
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    if (joins) {
      for (const [index, joinMeta] of joins.entries()) {
        if (index === 0) {
          joinsArray.push(sql` `);
        }
        const table = joinMeta.table;
        const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
        if (is(table, SQLiteTable)) {
          const tableName = table[SQLiteTable.Symbol.Name];
          const tableSchema = table[SQLiteTable.Symbol.Schema];
          const origTableName = table[SQLiteTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(
              origTableName
            )}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${table}${onSql}`
          );
        }
        if (index < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    return sql.join(joinsArray);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    const orderByList = [];
    if (orderBy) {
      for (const [index, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index < orderBy.length - 1) {
          orderByList.push(sql`, `);
        }
      }
    }
    return orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(
        table[Table.Symbol.OriginalName]
      )} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join(
            "->"
          )}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const groupByList = [];
    if (groupBy) {
      for (const [index, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index < groupBy.length - 1) {
          groupByList.push(sql`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`${leftSelect.getSQL()} `;
    const rightChunk = sql`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, SQLiteColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, SQLiteColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(
                this.casing.getColumnCasing(chunk)
              );
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({
    table,
    values: valuesOrSelect,
    onConflict,
    returning,
    withList,
    select
  }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            let defaultValue;
            if (col.default !== null && col.default !== void 0) {
              defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
            } else if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
            } else {
              defaultValue = sql`null`;
            }
            valueList.push(defaultValue);
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict?.length ? sql.join(onConflict) : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [
          key,
          aliasedTableColumn(value, tableAlias)
        ])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter(
            (key) => !selectedColumns.includes(key)
          );
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter(
          (entry) => !!entry[1]
        ).map(([tsKey, queryConfig]) => ({
          tsKey,
          queryConfig,
          relation: tableConfig.relations[tsKey]
        }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(
          schema,
          tableNamesMap,
          relation
        );
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(
                normalizedRelation.references[i],
                relationTableAlias
              ),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_group_array(${field}), json_array())`;
      }
      const nestedSelection = [
        {
          dbKey: "data",
          tsKey: "data",
          field: field.as("data"),
          isJson: true,
          relationTableTsKey: tableConfig.tsName,
          selection
        }
      ];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};
var SQLiteSyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteSyncDialect");
  }
  static {
    __name2(this, "SQLiteSyncDialect");
  }
  static [entityKind] = "SQLiteSyncDialect";
  migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run(sql`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql.raw(stmt));
          }
          session.run(
            sql`INSERT INTO ${sql.identifier(
              migrationsTable
            )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run(sql`COMMIT`);
    } catch (e) {
      session.run(sql`ROLLBACK`);
      throw e;
    }
  }
};
var SQLiteAsyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteAsyncDialect");
  }
  static {
    __name2(this, "SQLiteAsyncDialect");
  }
  static [entityKind] = "SQLiteAsyncDialect";
  async migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.run(sql.raw(stmt));
          }
          await tx.run(
            sql`INSERT INTO ${sql.identifier(
              migrationsTable
            )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
};
var TypedQueryBuilder = class {
  static {
    __name(this, "TypedQueryBuilder");
  }
  static {
    __name2(this, "TypedQueryBuilder");
  }
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};
var SQLiteSelectBuilder = class {
  static {
    __name(this, "SQLiteSelectBuilder");
  }
  static {
    __name2(this, "SQLiteSelectBuilder");
  }
  static [entityKind] = "SQLiteSelectBuilder";
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    this.withList = config.withList;
    this.distinct = config.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, SQLiteViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
};
var SQLiteSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static {
    __name(this, "SQLiteSelectQueryBuilderBase");
  }
  static {
    __name2(this, "SQLiteSelectQueryBuilderBase");
  }
  static [entityKind] = "SQLiteSelectQueryBuilder";
  _;
  /** @internal */
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/sqlite-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/sqlite-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
};
var SQLiteSelectBase = class extends SQLiteSelectQueryBuilderBase {
  static {
    __name(this, "SQLiteSelectBase");
  }
  static {
    __name2(this, "SQLiteSelectBase");
  }
  static [entityKind] = "SQLiteSelect";
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true,
      void 0,
      {
        type: "select",
        tables: [...this.usedTables]
      },
      this.cacheConfig
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.all();
  }
};
applyMixins(SQLiteSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
__name(createSetOperator, "createSetOperator");
__name2(createSetOperator, "createSetOperator");
var getSQLiteSetOperators = /* @__PURE__ */ __name2(() => ({
  union,
  unionAll,
  intersect,
  except
}), "getSQLiteSetOperators");
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var except = createSetOperator("except", false);
var QueryBuilder = class {
  static {
    __name(this, "QueryBuilder");
  }
  static {
    __name2(this, "QueryBuilder");
  }
  static [entityKind] = "SQLiteQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, SQLiteDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, SQLiteDialect) ? void 0 : dialect;
  }
  $with = /* @__PURE__ */ __name2((alias, selection) => {
    const queryBuilder = this;
    const as = /* @__PURE__ */ __name2((qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    __name(select, "select");
    __name2(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    __name2(selectDistinct, "selectDistinct");
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};
var SQLiteInsertBuilder = class {
  static {
    __name(this, "SQLiteInsertBuilder");
  }
  static {
    __name2(this, "SQLiteInsertBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteInsertBuilder";
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var SQLiteInsertBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteInsertBase");
  }
  static {
    __name2(this, "SQLiteInsertBase");
  }
  constructor(table, values, session, dialect, withList, select) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select };
  }
  static [entityKind] = "SQLiteInsert";
  /** @internal */
  config;
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (!this.config.onConflict) this.config.onConflict = [];
    if (config.target === void 0) {
      this.config.onConflict.push(sql` on conflict do nothing`);
    } else {
      const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
      const whereSql = config.where ? sql` where ${config.where}` : sql``;
      this.config.onConflict.push(sql` on conflict ${targetSql} do nothing${whereSql}`);
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    if (!this.config.onConflict) this.config.onConflict = [];
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    this.config.onConflict.push(
      sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
    );
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};
var SQLiteUpdateBuilder = class {
  static {
    __name(this, "SQLiteUpdateBuilder");
  }
  static {
    __name2(this, "SQLiteUpdateBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteUpdateBuilder";
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
};
var SQLiteUpdateBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteUpdateBase");
  }
  static {
    __name2(this, "SQLiteUpdateBase");
  }
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
  }
  static [entityKind] = "SQLiteUpdate";
  /** @internal */
  config;
  from(source) {
    this.config.from = source;
    return this;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from ? is(table, SQLiteTable) ? table[Table.Symbol.Columns] : is(table, Subquery) ? table._.selectedFields : is(table, SQLiteViewBase) ? table[ViewBaseConfig].selectedFields : void 0 : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name2((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};
var SQLiteCountBuilder = class _SQLiteCountBuilder extends SQL {
  static {
    __name(this, "_SQLiteCountBuilder");
  }
  static {
    __name2(this, "SQLiteCountBuilder");
  }
  constructor(params) {
    super(_SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.session = params.session;
    this.sql = _SQLiteCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  static [entityKind] = "SQLiteCountBuilderAsync";
  [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters}`;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};
var RelationalQueryBuilder = class {
  static {
    __name(this, "RelationalQueryBuilder");
  }
  static {
    __name2(this, "RelationalQueryBuilder");
  }
  constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "SQLiteAsyncRelationalQueryBuilder";
  findMany(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var SQLiteRelationalQuery = class extends QueryPromise {
  static {
    __name(this, "SQLiteRelationalQuery");
  }
  static {
    __name2(this, "SQLiteRelationalQuery");
  }
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "SQLiteAsyncRelationalQuery";
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
      true,
      (rawRows, mapColumnValue) => {
        const rows = rawRows.map(
          (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
        );
        if (this.mode === "first") {
          return rows[0];
        }
        return rows;
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
};
var SQLiteSyncRelationalQuery = class extends SQLiteRelationalQuery {
  static {
    __name(this, "SQLiteSyncRelationalQuery");
  }
  static {
    __name2(this, "SQLiteSyncRelationalQuery");
  }
  static [entityKind] = "SQLiteSyncRelationalQuery";
  sync() {
    return this.executeRaw();
  }
};
var SQLiteRaw = class extends QueryPromise {
  static {
    __name(this, "SQLiteRaw");
  }
  static {
    __name2(this, "SQLiteRaw");
  }
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  static [entityKind] = "SQLiteRaw";
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};
var BaseSQLiteDatabase = class {
  static {
    __name(this, "BaseSQLiteDatabase");
  }
  static {
    __name2(this, "BaseSQLiteDatabase");
  }
  constructor(resultKind, dialect, session, schema) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: /* @__PURE__ */ __name2(async (_params) => {
    }, "invalidate") };
  }
  static [entityKind] = "BaseSQLiteDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = /* @__PURE__ */ __name2((alias, selection) => {
    const self = this;
    const as = /* @__PURE__ */ __name2((qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  $count(source, filters) {
    return new SQLiteCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    __name(select, "select");
    __name2(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    __name2(selectDistinct, "selectDistinct");
    function update(table) {
      return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
    }
    __name(update, "update");
    __name2(update, "update");
    function insert(into) {
      return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
    }
    __name(insert, "insert");
    __name2(insert, "insert");
    function delete_(from) {
      return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
    }
    __name(delete_, "delete_");
    __name2(delete_, "delete_");
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  $cache;
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sequel),
        () => sequel,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sequel);
  }
  all(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sequel),
        () => sequel,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sequel);
  }
  get(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sequel),
        () => sequel,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sequel);
  }
  values(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sequel),
        () => sequel,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sequel);
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};
var Cache = class {
  static {
    __name(this, "Cache");
  }
  static {
    __name2(this, "Cache");
  }
  static [entityKind] = "Cache";
};
var NoopCache = class extends Cache {
  static {
    __name(this, "NoopCache");
  }
  static {
    __name2(this, "NoopCache");
  }
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
};
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
__name(hashQuery, "hashQuery");
__name2(hashQuery, "hashQuery");
var ExecuteResultSync = class extends QueryPromise {
  static {
    __name(this, "ExecuteResultSync");
  }
  static {
    __name2(this, "ExecuteResultSync");
  }
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  static [entityKind] = "ExecuteResultSync";
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
};
var SQLitePreparedQuery = class {
  static {
    __name(this, "SQLitePreparedQuery");
  }
  static {
    __name2(this, "SQLitePreparedQuery");
  }
  constructor(mode, executeMethod, query, cache2, queryMetadata, cacheConfig) {
    this.mode = mode;
    this.executeMethod = executeMethod;
    this.query = query;
    this.cache = cache2;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache2 && cache2.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  static [entityKind] = "PreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? await hashQuery(queryString, params),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? await hashQuery(queryString, params),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
};
var SQLiteSession = class {
  static {
    __name(this, "SQLiteSession");
  }
  static {
    __name2(this, "SQLiteSession");
  }
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "SQLiteSession";
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return this.prepareQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
      queryMetadata,
      cacheConfig
    );
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  async count(sql2) {
    const result = await this.values(sql2);
    return result[0][0];
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
};
var SQLiteTransaction = class extends BaseSQLiteDatabase {
  static {
    __name(this, "SQLiteTransaction");
  }
  static {
    __name2(this, "SQLiteTransaction");
  }
  constructor(resultType, dialect, session, schema, nestedIndex = 0) {
    super(resultType, dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "SQLiteTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
};
var SQLiteD1Session = class extends SQLiteSession {
  static {
    __name(this, "SQLiteD1Session");
  }
  static {
    __name2(this, "SQLiteD1Session");
  }
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "SQLiteD1Session";
  logger;
  cache;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    const stmt = this.client.prepare(query.sql);
    return new D1PreparedQuery(
      stmt,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async batch(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      if (builtQuery.params.length > 0) {
        builtQueries.push(preparedQuery.stmt.bind(...builtQuery.params));
      } else {
        const builtQuery2 = preparedQuery.getQuery();
        builtQueries.push(
          this.client.prepare(builtQuery2.sql).bind(...builtQuery2.params)
        );
      }
    }
    const batchResults = await this.client.batch(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  extractRawAllValueFromBatchResult(result) {
    return result.results;
  }
  extractRawGetValueFromBatchResult(result) {
    return result.results[0];
  }
  extractRawValuesValueFromBatchResult(result) {
    return d1ToRawMapping(result.results);
  }
  async transaction(transaction, config) {
    const tx = new D1Transaction("async", this.dialect, this, this.schema);
    await this.run(sql.raw(`begin${config?.behavior ? " " + config.behavior : ""}`));
    try {
      const result = await transaction(tx);
      await this.run(sql`commit`);
      return result;
    } catch (err) {
      await this.run(sql`rollback`);
      throw err;
    }
  }
};
var D1Transaction = class _D1Transaction extends SQLiteTransaction {
  static {
    __name(this, "_D1Transaction");
  }
  static {
    __name2(this, "D1Transaction");
  }
  static [entityKind] = "D1Transaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new _D1Transaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    await this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
};
function d1ToRawMapping(results) {
  const rows = [];
  for (const row of results) {
    const entry = Object.keys(row).map((k) => row[k]);
    rows.push(entry);
  }
  return rows;
}
__name(d1ToRawMapping, "d1ToRawMapping");
__name2(d1ToRawMapping, "d1ToRawMapping");
var D1PreparedQuery = class extends SQLitePreparedQuery {
  static {
    __name(this, "D1PreparedQuery");
  }
  static {
    __name2(this, "D1PreparedQuery");
  }
  constructor(stmt, query, logger, cache2, queryMetadata, cacheConfig, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("async", executeMethod, query, cache2, queryMetadata, cacheConfig);
    this.logger = logger;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.fields = fields;
    this.stmt = stmt;
  }
  static [entityKind] = "D1PreparedQuery";
  /** @internal */
  customResultMapper;
  /** @internal */
  fields;
  /** @internal */
  stmt;
  async run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      return this.stmt.bind(...params).run();
    });
  }
  async all(placeholderValues) {
    const { fields, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        return stmt.bind(...params).all().then(({ results }) => this.mapAllResult(results));
      });
    }
    const rows = await this.values(placeholderValues);
    return this.mapAllResult(rows);
  }
  mapAllResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = d1ToRawMapping(rows.results);
    }
    if (!this.fields && !this.customResultMapper) {
      return rows;
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows);
    }
    return rows.map((row) => mapResultRow(this.fields, row, this.joinsNotNullableMap));
  }
  async get(placeholderValues) {
    const { fields, joinsNotNullableMap, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        return stmt.bind(...params).all().then(({ results }) => results[0]);
      });
    }
    const rows = await this.values(placeholderValues);
    if (!rows[0]) {
      return void 0;
    }
    if (customResultMapper) {
      return customResultMapper(rows);
    }
    return mapResultRow(fields, rows[0], joinsNotNullableMap);
  }
  mapGetResult(result, isFromBatch) {
    if (isFromBatch) {
      result = d1ToRawMapping(result.results)[0];
    }
    if (!this.fields && !this.customResultMapper) {
      return result;
    }
    if (this.customResultMapper) {
      return this.customResultMapper([result]);
    }
    return mapResultRow(this.fields, result, this.joinsNotNullableMap);
  }
  async values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      return this.stmt.bind(...params).raw();
    });
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};
var DrizzleD1Database = class extends BaseSQLiteDatabase {
  static {
    __name(this, "DrizzleD1Database");
  }
  static {
    __name2(this, "DrizzleD1Database");
  }
  static [entityKind] = "D1Database";
  async batch(batch) {
    return this.session.batch(batch);
  }
};
function drizzle(client, config = {}) {
  const dialect = new SQLiteAsyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new SQLiteD1Session(client, dialect, schema, { logger, cache: config.cache });
  const db = new DrizzleD1Database("async", dialect, session, schema);
  db.$client = client;
  db.$cache = config.cache;
  if (db.$cache) {
    db.$cache["invalidate"] = config.cache?.onMutate;
  }
  return db;
}
__name(drizzle, "drizzle");
__name2(drizzle, "drizzle");
var schema_exports = {};
__export(schema_exports, {
  adminNotes: /* @__PURE__ */ __name(() => adminNotes, "adminNotes"),
  announcements: /* @__PURE__ */ __name(() => announcements, "announcements"),
  attendanceMarks: /* @__PURE__ */ __name(() => attendanceMarks, "attendanceMarks"),
  attendanceSessions: /* @__PURE__ */ __name(() => attendanceSessions, "attendanceSessions"),
  auditLogs: /* @__PURE__ */ __name(() => auditLogs, "auditLogs"),
  exams: /* @__PURE__ */ __name(() => exams, "exams"),
  passwordResets: /* @__PURE__ */ __name(() => passwordResets, "passwordResets"),
  paymentGatewayKeys: /* @__PURE__ */ __name(() => paymentGatewayKeys, "paymentGatewayKeys"),
  paymentGatewayWebhooks: /* @__PURE__ */ __name(() => paymentGatewayWebhooks, "paymentGatewayWebhooks"),
  payments: /* @__PURE__ */ __name(() => payments, "payments"),
  reportExports: /* @__PURE__ */ __name(() => reportExports, "reportExports"),
  reportExtras: /* @__PURE__ */ __name(() => reportExtras, "reportExtras"),
  schools: /* @__PURE__ */ __name(() => schools, "schools"),
  scoreSheets: /* @__PURE__ */ __name(() => scoreSheets, "scoreSheets"),
  studentLinks: /* @__PURE__ */ __name(() => studentLinks, "studentLinks"),
  students: /* @__PURE__ */ __name(() => students, "students"),
  systemSettings: /* @__PURE__ */ __name(() => systemSettings, "systemSettings"),
  teacherClassAssignments: /* @__PURE__ */ __name(() => teacherClassAssignments, "teacherClassAssignments"),
  teacherProfiles: /* @__PURE__ */ __name(() => teacherProfiles, "teacherProfiles"),
  users: /* @__PURE__ */ __name(() => users, "users")
});
var users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  forcePasswordChange: integer("force_password_change").notNull().default(0),
  lastLoginAt: text("last_login_at"),
  phone: text("phone"),
  schoolId: text("school_id"),
  totpEnabled: integer("totp_enabled").notNull().default(0)
});
var schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  abbr: text("abbr").notNull(),
  address: text("address"),
  contact: text("contact"),
  motto: text("motto"),
  principal: text("principal"),
  session: text("session"),
  term: text("term"),
  schoolLevel: text("school_level").notNull().default("Secondary"),
  classTemplates: text("class_templates").notNull().default("{}"),
  classArms: text("class_arms").notNull().default("{}"),
  nextTerm: text("next_term"),
  ca1Max: integer("ca1_max").notNull().default(10),
  ca2Max: integer("ca2_max").notNull().default(10),
  examMax: integer("exam_max").notNull().default(80),
  subjects: text("subjects").notNull(),
  grades: text("grades").notNull(),
  plan: text("plan").notNull().default("LIFETIME"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  timezone: text("timezone"),
  locale: text("locale"),
  currency: text("currency").notNull().default("NGN"),
  subdomain: text("subdomain").unique(),
  trialEndsAt: text("trial_ends_at"),
  lastReminderAt: text("last_reminder_at"),
  logoUrl: text("logo_url"),
  reportColor: text("report_color").notNull().default("#4f46e5"),
  reportTemplate: text("report_template").notNull().default("ELITE"),
  promotionLogic: text("promotion_logic").notNull().default("{}"),
  customCss: text("custom_css"),
  customJs: text("custom_js"),
  deletedAt: text("deleted_at"),
  deletedReason: text("deleted_reason"),
  deletedByUserId: text("deleted_by_user_id"),
  purgeAfter: text("purge_after"),
  require2fa: integer("require_2fa").notNull().default(0)
});
var teacherProfiles = sqliteTable("teacher_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at")
});
var teacherClassAssignments = sqliteTable("teacher_class_assignments", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  teacherUserId: text("teacher_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  className: text("class_name").notNull(),
  createdAt: text("created_at").notNull()
}, (table) => {
  return {
    assignmentUnique: uniqueIndex("assignment_unique").on(table.schoolId, table.teacherUserId, table.className)
  };
});
var students = sqliteTable("students", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  admissionNo: text("admission_no").notNull(),
  gender: text("gender"),
  className: text("class_name"),
  dob: text("dob"),
  house: text("house"),
  parent: text("parent"),
  photoUrl: text("photo_url"),
  address: text("address"),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  guardianEmail: text("guardian_email"),
  emergencyName: text("emergency_name"),
  emergencyPhone: text("emergency_phone"),
  profileExtra: text("profile_extra").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at")
}, (table) => {
  return {
    schoolAdmissionUnique: uniqueIndex("school_admission_unique").on(table.schoolId, table.admissionNo)
  };
});
var studentLinks = sqliteTable("student_links", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  linkType: text("link_type").notNull(),
  createdAt: text("created_at").notNull()
}, (table) => {
  return {
    studentUserLinkUnique: uniqueIndex("student_user_link_unique").on(table.studentId, table.userId, table.linkType)
  };
});
var attendanceSessions = sqliteTable("attendance_sessions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  className: text("class_name").notNull(),
  sessionDate: text("session_date").notNull(),
  session: text("session").notNull().default(""),
  term: text("term").notNull().default(""),
  takenByUserId: text("taken_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("DRAFT"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at")
}, (table) => {
  return {
    schoolClassDateUnique: uniqueIndex("school_class_date_unique").on(table.schoolId, table.className, table.sessionDate)
  };
});
var attendanceMarks = sqliteTable("attendance_marks", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  attendanceSessionId: text("attendance_session_id").notNull().references(() => attendanceSessions.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  mark: text("mark").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at")
}, (table) => {
  return {
    sessionStudentUnique: uniqueIndex("session_student_unique").on(table.attendanceSessionId, table.studentId)
  };
});
var scoreSheets = sqliteTable("score_sheets", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  session: text("session").notNull().default(""),
  term: text("term").notNull().default(""),
  data: text("data").notNull(),
  // JSON
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
}, (table) => {
  return {
    schoolStudentTermUnique: uniqueIndex("school_student_term_unique_scores").on(table.schoolId, table.studentId, table.session, table.term)
  };
});
var reportExtras = sqliteTable("report_extras", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  session: text("session").notNull(),
  term: text("term").notNull(),
  attendance: text("attendance").notNull(),
  traits: text("traits").notNull(),
  comments: text("comments").notNull().default("{}"),
  // JSON
  promotion: text("promotion").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
}, (table) => {
  return {
    schoolStudentSessionTermUnique: uniqueIndex("report_extras_unique").on(table.schoolId, table.studentId, table.session, table.term)
  };
});
var reportExports = sqliteTable("report_exports", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull()
});
var payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("PENDING"),
  amountKobo: integer("amount_kobo").notNull(),
  currency: text("currency").notNull().default("NGN"),
  reference: text("reference").notNull().unique(),
  metadata: text("metadata").notNull(),
  // JSON
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at")
});
var auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  schoolId: text("school_id").references(() => schools.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  data: text("data").notNull(),
  // JSON
  createdAt: text("created_at").notNull(),
  prevHash: text("prev_hash"),
  entryHash: text("entry_hash")
});
var adminNotes = sqliteTable("admin_notes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
  note: text("note").notNull(),
  createdAt: text("created_at").notNull()
});
var systemSettings = sqliteTable("system_settings", {
  k: text("k").primaryKey(),
  v: text("v").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedByUserId: text("updated_by_user_id")
});
var paymentGatewayKeys = sqliteTable("payment_gateway_keys", {
  id: text("id").primaryKey(),
  gateway: text("gateway").notNull(),
  environment: text("environment").notNull(),
  keyName: text("key_name").notNull(),
  ciphertext: blob("ciphertext").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  createdByUserId: text("created_by_user_id"),
  revokedAt: text("revoked_at"),
  revokedByUserId: text("revoked_by_user_id")
}, (table) => {
  return {
    gatewayEnvKeyActiveUnique: uniqueIndex("gateway_keys_unique").on(table.gateway, table.environment, table.keyName, table.active)
  };
});
var paymentGatewayWebhooks = sqliteTable("payment_gateway_webhooks", {
  id: text("id").primaryKey(),
  gateway: text("gateway").notNull(),
  environment: text("environment").notNull(),
  url: text("url").notNull()
});
var exams = sqliteTable("exams", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  classLevel: text("class_level").notNull(),
  topic: text("topic"),
  questions: text("questions").notNull(),
  // JSON
  term: text("term"),
  // e.g. "1st Term", "2nd Term", "3rd Term"
  session: text("session"),
  // e.g. "2025/2026"
  examType: text("exam_type"),
  // e.g. "Terminal Exam", "CA", "Mock"
  questionType: text("question_type"),
  // e.g. "mcq", "theory", "mixed"
  sourceMode: text("source_mode"),
  // e.g. "topic", "document", "url"
  duration: text("duration"),
  // e.g. "1 Hour", "1hr 30mins"
  fileUrl: text("file_url"),
  // URL to the original uploaded document
  isShared: integer("is_shared").notNull().default(0),
  // 0 = private, 1 = shared
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at")
});
var announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  authorUserId: text("author_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  targetRole: text("target_role").notNull().default("SCHOOL"),
  // 'SCHOOL', 'TEACHER', 'ALL'
  status: text("status").notNull().default("ACTIVE"),
  priority: text("priority").notNull().default("NORMAL"),
  // 'LOW', 'NORMAL', 'HIGH', 'URGENT'
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at")
});
var passwordResets = sqliteTable("password_resets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  usedAt: text("used_at")
});
var onRequestGet = /* @__PURE__ */ __name2(async (context) => {
  try {
    const db = drizzle(context.env.DB);
    const result = await db.select({ count: users.id }).from(users).limit(1);
    return new Response(JSON.stringify({
      status: "healthy",
      database: "connected",
      message: "Conductor AI / ReportSheet API is online"
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: "unhealthy",
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}, "onRequestGet");
function createDb(d1) {
  return drizzle(d1, { schema: schema_exports });
}
__name(createDb, "createDb");
__name2(createDb, "createDb");
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");
__name2(concat, "concat");
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
__name(encode, "encode");
__name2(encode, "encode");
function encodeBase64(input) {
  if (Uint8Array.prototype.toBase64) {
    return input.toBase64();
  }
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0; i < input.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join(""));
}
__name(encodeBase64, "encodeBase64");
__name2(encodeBase64, "encodeBase64");
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(decodeBase64, "decodeBase64");
__name2(decodeBase64, "decodeBase64");
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
__name(decode, "decode");
__name2(decode, "decode");
function encode2(input) {
  let unencoded = input;
  if (typeof unencoded === "string") {
    unencoded = encoder.encode(unencoded);
  }
  if (Uint8Array.prototype.toBase64) {
    return unencoded.toBase64({ alphabet: "base64url", omitPadding: true });
  }
  return encodeBase64(unencoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(encode2, "encode2");
__name2(encode2, "encode");
var unusable = /* @__PURE__ */ __name2((name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), "unusable");
var isAlgorithm = /* @__PURE__ */ __name2((algorithm, name) => algorithm.name === name, "isAlgorithm");
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
__name2(getHashLength, "getHashLength");
function checkHashLength(algorithm, expected) {
  const actual = getHashLength(algorithm.hash);
  if (actual !== expected)
    throw unusable(`SHA-${expected}`, "algorithm.hash");
}
__name(checkHashLength, "checkHashLength");
__name2(checkHashLength, "checkHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
__name2(getNamedCurve, "getNamedCurve");
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
__name(checkUsage, "checkUsage");
__name2(checkUsage, "checkUsage");
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");
__name2(checkSigCryptoKey, "checkSigCryptoKey");
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
__name2(message, "message");
var invalidKeyInput = /* @__PURE__ */ __name2((actual, ...types) => message("Key must be ", actual, ...types), "invalidKeyInput");
var withAlg = /* @__PURE__ */ __name2((alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types), "withAlg");
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  static {
    __name2(this, "JOSEError");
  }
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  static {
    __name2(this, "JWTClaimValidationFailed");
  }
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  static {
    __name2(this, "JWTExpired");
  }
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  static {
    __name2(this, "JOSEAlgNotAllowed");
  }
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  static {
    __name2(this, "JOSENotSupported");
  }
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  static {
    __name2(this, "JWSInvalid");
  }
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  static {
    __name2(this, "JWTInvalid");
  }
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  static {
    __name2(this, "JWSSignatureVerificationFailed");
  }
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};
var isCryptoKey = /* @__PURE__ */ __name2((key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
}, "isCryptoKey");
var isKeyObject = /* @__PURE__ */ __name2((key) => key?.[Symbol.toStringTag] === "KeyObject", "isKeyObject");
var isKeyLike = /* @__PURE__ */ __name2((key) => isCryptoKey(key) || isKeyObject(key), "isKeyLike");
function assertNotSet(value, name) {
  if (value) {
    throw new TypeError(`${name} can only be called once`);
  }
}
__name(assertNotSet, "assertNotSet");
__name2(assertNotSet, "assertNotSet");
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
__name(decodeBase64url, "decodeBase64url");
__name2(decodeBase64url, "decodeBase64url");
var isObjectLike = /* @__PURE__ */ __name2((value) => typeof value === "object" && value !== null, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");
__name2(isObject, "isObject");
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
__name(isDisjoint, "isDisjoint");
__name2(isDisjoint, "isDisjoint");
var isJWK = /* @__PURE__ */ __name2((key) => isObject(key) && typeof key.kty === "string", "isJWK");
var isPrivateJWK = /* @__PURE__ */ __name2((key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string"), "isPrivateJWK");
var isPublicJWK = /* @__PURE__ */ __name2((key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0, "isPublicJWK");
var isSecretJWK = /* @__PURE__ */ __name2((key) => key.kty === "oct" && typeof key.k === "string", "isSecretJWK");
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
__name(checkKeyLength, "checkKeyLength");
__name2(checkKeyLength, "checkKeyLength");
function subtleAlgorithm(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleAlgorithm, "subtleAlgorithm");
__name2(subtleAlgorithm, "subtleAlgorithm");
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
__name(getSigKey, "getSigKey");
__name2(getSigKey, "getSigKey");
async function sign(alg, key, data) {
  const cryptoKey = await getSigKey(alg, key, "sign");
  checkKeyLength(alg, cryptoKey);
  const signature = await crypto.subtle.sign(subtleAlgorithm(alg, cryptoKey.algorithm), cryptoKey, data);
  return new Uint8Array(signature);
}
__name(sign, "sign");
__name2(sign, "sign");
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
__name(verify, "verify");
__name2(verify, "verify");
var unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
        case "ES384":
        case "ES512":
          algorithm = {
            name: "ECDSA",
            namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[jwk.alg]
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
__name2(subtleMapping, "subtleMapping");
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
__name(jwkToKey, "jwkToKey");
__name2(jwkToKey, "jwkToKey");
var unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
var cache;
var handleJWK = /* @__PURE__ */ __name2(async (key, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwkToKey({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleJWK");
var handleKeyObject = /* @__PURE__ */ __name2((keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError(unusableForAlg);
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError(unusableForAlg);
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash;
    switch (alg) {
      case "RSA-OAEP":
        hash = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash = "SHA-512";
        break;
      default:
        throw new TypeError(unusableForAlg);
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = /* @__PURE__ */ new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError(unusableForAlg);
    }
    const expectedCurve = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
    if (expectedCurve[alg] && namedCurve === expectedCurve[alg]) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError(unusableForAlg);
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleKeyObject");
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
__name(normalizeKey, "normalizeKey");
__name2(normalizeKey, "normalizeKey");
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");
__name2(validateCrit, "validateCrit");
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
__name(validateAlgorithms, "validateAlgorithms");
__name2(validateAlgorithms, "validateAlgorithms");
var tag = /* @__PURE__ */ __name2((key) => key?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name2((alg, key, usage) => {
  if (key.use !== void 0) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name2((alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name2((alg, key, usage) => {
  if (isJWK(key)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  }
  if (key.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
  }
}, "asymmetricTypeCheck");
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
__name(checkKeyType, "checkKeyType");
__name2(checkKeyType, "checkKeyType");
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  const signature = decodeBase64url(jws.signature, "signature", JWSInvalid);
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    payload = decodeBase64url(jws.payload, "payload", JWSInvalid);
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");
__name2(flattenedVerify, "flattenedVerify");
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");
__name2(compactVerify, "compactVerify");
var epoch = /* @__PURE__ */ __name2((date) => Math.floor(date.getTime() / 1e3), "epoch");
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
__name(secs, "secs");
__name2(secs, "secs");
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
__name(validateInput, "validateInput");
__name2(validateInput, "validateInput");
var normalizeTyp = /* @__PURE__ */ __name2((value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
}, "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name2((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
__name(validateClaimsSet, "validateClaimsSet");
__name2(validateClaimsSet, "validateClaimsSet");
var JWTClaimsBuilder = class {
  static {
    __name(this, "JWTClaimsBuilder");
  }
  static {
    __name2(this, "JWTClaimsBuilder");
  }
  #payload;
  constructor(payload) {
    if (!isObject(payload)) {
      throw new TypeError("JWT Claims Set MUST be an object");
    }
    this.#payload = structuredClone(payload);
  }
  data() {
    return encoder.encode(JSON.stringify(this.#payload));
  }
  get iss() {
    return this.#payload.iss;
  }
  set iss(value) {
    this.#payload.iss = value;
  }
  get sub() {
    return this.#payload.sub;
  }
  set sub(value) {
    this.#payload.sub = value;
  }
  get aud() {
    return this.#payload.aud;
  }
  set aud(value) {
    this.#payload.aud = value;
  }
  set jti(value) {
    this.#payload.jti = value;
  }
  set nbf(value) {
    if (typeof value === "number") {
      this.#payload.nbf = validateInput("setNotBefore", value);
    } else if (value instanceof Date) {
      this.#payload.nbf = validateInput("setNotBefore", epoch(value));
    } else {
      this.#payload.nbf = epoch(/* @__PURE__ */ new Date()) + secs(value);
    }
  }
  set exp(value) {
    if (typeof value === "number") {
      this.#payload.exp = validateInput("setExpirationTime", value);
    } else if (value instanceof Date) {
      this.#payload.exp = validateInput("setExpirationTime", epoch(value));
    } else {
      this.#payload.exp = epoch(/* @__PURE__ */ new Date()) + secs(value);
    }
  }
  set iat(value) {
    if (value === void 0) {
      this.#payload.iat = epoch(/* @__PURE__ */ new Date());
    } else if (value instanceof Date) {
      this.#payload.iat = validateInput("setIssuedAt", epoch(value));
    } else if (typeof value === "string") {
      this.#payload.iat = validateInput("setIssuedAt", epoch(/* @__PURE__ */ new Date()) + secs(value));
    } else {
      this.#payload.iat = validateInput("setIssuedAt", value);
    }
  }
};
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");
__name2(jwtVerify, "jwtVerify");
var FlattenedSign = class {
  static {
    __name(this, "FlattenedSign");
  }
  static {
    __name2(this, "FlattenedSign");
  }
  #payload;
  #protectedHeader;
  #unprotectedHeader;
  constructor(payload) {
    if (!(payload instanceof Uint8Array)) {
      throw new TypeError("payload must be an instance of Uint8Array");
    }
    this.#payload = payload;
  }
  setProtectedHeader(protectedHeader) {
    assertNotSet(this.#protectedHeader, "setProtectedHeader");
    this.#protectedHeader = protectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    assertNotSet(this.#unprotectedHeader, "setUnprotectedHeader");
    this.#unprotectedHeader = unprotectedHeader;
    return this;
  }
  async sign(key, options) {
    if (!this.#protectedHeader && !this.#unprotectedHeader) {
      throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
    }
    if (!isDisjoint(this.#protectedHeader, this.#unprotectedHeader)) {
      throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
    }
    const joseHeader = {
      ...this.#protectedHeader,
      ...this.#unprotectedHeader
    };
    const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this.#protectedHeader, joseHeader);
    let b64 = true;
    if (extensions.has("b64")) {
      b64 = this.#protectedHeader.b64;
      if (typeof b64 !== "boolean") {
        throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
      }
    }
    const { alg } = joseHeader;
    if (typeof alg !== "string" || !alg) {
      throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    checkKeyType(alg, key, "sign");
    let payloadS;
    let payloadB;
    if (b64) {
      payloadS = encode2(this.#payload);
      payloadB = encode(payloadS);
    } else {
      payloadB = this.#payload;
      payloadS = "";
    }
    let protectedHeaderString;
    let protectedHeaderBytes;
    if (this.#protectedHeader) {
      protectedHeaderString = encode2(JSON.stringify(this.#protectedHeader));
      protectedHeaderBytes = encode(protectedHeaderString);
    } else {
      protectedHeaderString = "";
      protectedHeaderBytes = new Uint8Array();
    }
    const data = concat(protectedHeaderBytes, encode("."), payloadB);
    const k = await normalizeKey(key, alg);
    const signature = await sign(alg, k, data);
    const jws = {
      signature: encode2(signature),
      payload: payloadS
    };
    if (this.#unprotectedHeader) {
      jws.header = this.#unprotectedHeader;
    }
    if (this.#protectedHeader) {
      jws.protected = protectedHeaderString;
    }
    return jws;
  }
};
var CompactSign = class {
  static {
    __name(this, "CompactSign");
  }
  static {
    __name2(this, "CompactSign");
  }
  #flattened;
  constructor(payload) {
    this.#flattened = new FlattenedSign(payload);
  }
  setProtectedHeader(protectedHeader) {
    this.#flattened.setProtectedHeader(protectedHeader);
    return this;
  }
  async sign(key, options) {
    const jws = await this.#flattened.sign(key, options);
    if (jws.payload === void 0) {
      throw new TypeError("use the flattened module for creating JWS with b64: false");
    }
    return `${jws.protected}.${jws.payload}.${jws.signature}`;
  }
};
var SignJWT = class {
  static {
    __name(this, "SignJWT");
  }
  static {
    __name2(this, "SignJWT");
  }
  #protectedHeader;
  #jwt;
  constructor(payload = {}) {
    this.#jwt = new JWTClaimsBuilder(payload);
  }
  setIssuer(issuer) {
    this.#jwt.iss = issuer;
    return this;
  }
  setSubject(subject) {
    this.#jwt.sub = subject;
    return this;
  }
  setAudience(audience) {
    this.#jwt.aud = audience;
    return this;
  }
  setJti(jwtId) {
    this.#jwt.jti = jwtId;
    return this;
  }
  setNotBefore(input) {
    this.#jwt.nbf = input;
    return this;
  }
  setExpirationTime(input) {
    this.#jwt.exp = input;
    return this;
  }
  setIssuedAt(input) {
    this.#jwt.iat = input;
    return this;
  }
  setProtectedHeader(protectedHeader) {
    this.#protectedHeader = protectedHeader;
    return this;
  }
  async sign(key, options) {
    const sig = new CompactSign(this.#jwt.data());
    sig.setProtectedHeader(this.#protectedHeader);
    if (Array.isArray(this.#protectedHeader?.crit) && this.#protectedHeader.crit.includes("b64") && this.#protectedHeader.b64 === false) {
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    }
    return sig.sign(key, options);
  }
};
var ALGORITHM = "HS256";
var ISSUER = "edureport-ng";
var DEFAULT_SECRET = "edureport-ng-default-secret-change-in-production-min-32-chars!";
function getSecret(customSecret) {
  const envSecret = typeof process !== "undefined" ? process.env?.JWT_SECRET : void 0;
  const secret = customSecret || envSecret || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}
__name(getSecret, "getSecret");
__name2(getSecret, "getSecret");
async function signToken(payload, secret) {
  return new SignJWT(payload).setProtectedHeader({ alg: ALGORITHM }).setIssuedAt().setIssuer(ISSUER).setExpirationTime("7d").sign(getSecret(secret));
}
__name(signToken, "signToken");
__name2(signToken, "signToken");
async function verifyToken(token, secret) {
  try {
    const { payload } = await jwtVerify(token, getSecret(secret), {
      issuer: ISSUER
    });
    return payload;
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");
__name2(verifyToken, "verifyToken");
async function hashPassword(password) {
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
__name2(hashPassword, "hashPassword");
async function verifyPassword(password, hash) {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}
__name(verifyPassword, "verifyPassword");
__name2(verifyPassword, "verifyPassword");
var EmailService = class {
  static {
    __name(this, "EmailService");
  }
  static {
    __name2(this, "EmailService");
  }
  constructor(env) {
    this.apiKey = env.RESEND_API_KEY || "";
    this.fromEmail = env.SMTP_FROM_EMAIL || "notifications@reportsheet.com.ng";
    this.fromName = env.SMTP_FROM_NAME || "ReportSheet NG";
  }
  async send(options) {
    if (!this.apiKey) {
      console.warn("Email skipped: RESEND_API_KEY is not set.");
      return { success: false, message: "API key missing" };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [options.to],
          subject: options.subject,
          html: options.html
        })
      });
      const data = await res.json();
      return { success: res.ok, data };
    } catch (err) {
      console.error("Email send failed:", err);
      return { success: false, error: err };
    }
  }
  // --- Templates ---
  static getBaseTemplate(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #141412; margin: 0; padding: 0; background-color: #faf8f3; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e0d8; }
          .header { background: #1a6b3c; color: #ffffff; padding: 30px; text-align: center; }
          .content { padding: 40px; }
          .footer { background: #f5f3ee; color: #7c7a76; padding: 20px; text-align: center; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #1a6b3c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
          .info-box { background: #fdecea; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(192, 57, 43, 0.1); }
          h1 { margin: 0; font-size: 24px; }
          p { margin: 0 0 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ReportSheet<span style="font-weight: normal; opacity: 0.7;">NG</span></h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ReportSheet Nigerian School Portal. All rights reserved.<br>
            Hephtech Innovations
          </div>
        </div>
      </body>
      </html>
    `;
  }
  static getWelcomeAdminTemplate(schoolName, loginUrl) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Welcome to the future of school management!</h2>
      <p>Hello Administrator,</p>
      <p>Congratulations! Your school, <strong>${schoolName}</strong>, has been successfully registered on ReportSheet NG.</p>
      <p>You can now start adding your teachers, registering students, and recording academic results with zero arithmetic errors.</p>
      <a href="${loginUrl}" class="btn">Access Your Dashboard</a>
      <p style="margin-top: 30px; font-size: 13px; color: #7c7a76;">Need help? Reply to this email or visit our documentation.</p>
    `);
  }
  static getStaffInviteTemplate(schoolName, name, email, password, loginUrl) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">You've been invited!</h2>
      <p>Hello ${name},</p>
      <p>The management of <strong>${schoolName}</strong> has created a staff account for you on their official portal.</p>
      <div class="info-box" style="background: #e8f5ee; border-color: #1a6b3c; color: #0d4526;">
        <p style="margin-bottom: 5px;"><strong>Your Login Credentials:</strong></p>
        <p>Email: ${email}<br>Password: ${password}</p>
      </div>
      <p>Please log in and change your password immediately to ensure your account is secure.</p>
      <a href="${loginUrl}" class="btn">Login to Staff Portal</a>
    `);
  }
  static getParentInviteTemplate(schoolName, parentName, studentName, email, password, loginUrl) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Access Your Child's Results Online</h2>
      <p>Hello ${parentName},</p>
      <p><strong>${schoolName}</strong> has activated your parent portal access. You can now view academic reports and attendance records for <strong>${studentName}</strong> from your phone or computer.</p>
      <div class="info-box" style="background: #fff8e8; border-color: #c8902a; color: #3d3b38;">
        <p style="margin-bottom: 5px;"><strong>Your Access Details:</strong></p>
        <p>Login Email: ${email}<br>Temporary Password: ${password}</p>
      </div>
      <a href="${loginUrl}" class="btn" style="background-color: #c8902a;">Open Result Portal</a>
      <p style="margin-top: 30px; font-size: 13px; color: #7c7a76;">Keep your password safe. Do not share it with anyone.</p>
    `);
  }
  static getPaymentSuccessTemplate(schoolName, planName, amount, reference) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Payment Confirmed!</h2>
      <p>Thank you for your payment.</p>
      <p>The subscription for <strong>${schoolName}</strong> has been successfully upgraded to the <strong>${planName}</strong> plan.</p>
      <div class="info-box" style="background: #e8f5ee; border-color: #1a6b3c; color: #0d4526;">
        <p><strong>Transaction Details:</strong></p>
        <p>Amount: ${amount}<br>Reference: ${reference}<br>Status: Success</p>
      </div>
      <p>Your new features are now active. Thank you for choosing ReportSheet!</p>
    `);
  }
  static getPasswordResetTemplate(name, resetUrl) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your ReportSheet account password. Click the button below to set a new password.</p>
      <a href="${resetUrl}" class="btn">Reset My Password</a>
      <p style="margin-top: 30px; font-size: 13px; color: #7c7a76;">If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>
    `);
  }
  static getUpgradeReminderTemplate(schoolName, daysLeft, upgradeUrl) {
    const isExpired = daysLeft <= 0;
    const title = isExpired ? "Your Trial has Expired" : `Only ${daysLeft} Days Left in Your Trial`;
    const message2 = isExpired ? `Your free trial for <strong>${schoolName}</strong> has ended. To continue managing your school and accessing student records, please upgrade to a premium plan.` : `We hope you're enjoying your experience with ReportSheet NG! This is a friendly reminder that your free trial for <strong>${schoolName}</strong> will end in ${daysLeft} days.`;
    return this.getBaseTemplate(`
      <h2 style="color: ${isExpired ? "#c0392b" : "#1a6b3c"};">${title}</h2>
      <p>Hello Administrator,</p>
      <p>${message2}</p>
      <div class="info-box" style="background: ${isExpired ? "#fdecea" : "#e8f5ee"}; border-color: ${isExpired ? "#c0392b" : "#1a6b3c"}; color: ${isExpired ? "#c0392b" : "#0d4526"};">
        <p><strong>Subscription Status:</strong> ${isExpired ? "EXPIRED" : "FREE TRIAL"}</p>
        <p>Keep your data safe and unlock unlimited report generation by upgrading today.</p>
      </div>
      <a href="${upgradeUrl}" class="btn" style="background-color: ${isExpired ? "#c0392b" : "#1a6b3c"};">Upgrade to Premium</a>
      <p style="margin-top: 30px; font-size: 13px; color: #7c7a76;">Need more time? Contact our support team to discuss your needs.</p>
    `);
  }
  static getStudentInviteTemplate(schoolName, studentName, email, password, loginUrl) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Your Student Portal is Ready!</h2>
      <p>Hello ${studentName},</p>
      <p><strong>${schoolName}</strong> has created your personal student portal. You can now log in to track your attendance, view your term results, and access study materials.</p>
      <div class="info-box" style="background: #e8eef7; border-color: #1a4f8c; color: #1a4f8c;">
        <p style="margin-bottom: 5px;"><strong>Your Portal Access:</strong></p>
        <p>Email: ${email}<br>Temporary Password: ${password}</p>
      </div>
      <p>Log in using the button below and change your password to something you'll remember.</p>
      <a href="${loginUrl}" class="btn" style="background-color: #1a4f8c;">Login to Student Portal</a>
    `);
  }
};
function jsonResponse(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(jsonResponse, "jsonResponse");
__name2(jsonResponse, "jsonResponse");
function errorResponse(message2, status = 400, origin = "*") {
  return jsonResponse({ error: { message: message2 } }, status, origin);
}
__name(errorResponse, "errorResponse");
__name2(errorResponse, "errorResponse");
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const origin = request.headers.get("Origin") || "*";
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  try {
    if (!env.DB) {
      throw new Error("Database binding (DB) is missing. Check your wrangler.toml or Cloudflare dashboard.");
    }
    const db = createDb(env.DB);
    const path = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "config" && method === "GET") {
      return await handleGetPublicConfig(db, origin);
    }
    if (parts[0] === "upload" && method === "POST") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session) return errorResponse("Unauthorized", 401, origin);
      return await handleFileUpload(request, env.BUCKET, origin);
    }
    if (parts[0] === "files" && parts.length === 2 && method === "GET") {
      return await handleFileDownload(env.BUCKET, parts[1], origin);
    }
    if (parts[0] === "announcements" && method === "GET") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (session) {
        return await handleGetPortalAnnouncements(db, session.role, origin);
      }
      return errorResponse("Unauthorized", 401, origin);
    }
    if (parts[0] === "auth" || parts.length === 1 && parts[0] === "me") {
      if (parts[0] === "auth" && parts[1] === "login" && method === "POST") {
        return await handleLogin(db, request, origin, env.JWT_SECRET);
      }
      if (parts[0] === "auth" && parts[1] === "register" && method === "POST") {
        return await handleRegister(db, request, origin, env);
      }
      if (parts[0] === "auth" && parts[1] === "check-domain" && method === "GET") {
        return await handleCheckDomain(db, request, origin);
      }
      if (parts[0] === "auth" && parts[1] === "school-public" && parts.length === 3 && method === "GET") {
        return await handleGetSchoolPublic(db, parts[2], origin);
      }
      if (parts[0] === "auth" && parts[1] === "logout" && method === "POST") {
        return await handleLogout(origin);
      }
      if (parts[0] === "auth" && parts[1] === "me" || parts.length === 1 && parts[0] === "me") {
        return await handleMe(db, request, origin, env.JWT_SECRET);
      }
      if (parts[0] === "auth" && parts[1] === "change-password" && method === "POST") {
        return await handleChangePassword(db, request, origin, env.JWT_SECRET);
      }
      if (parts[0] === "auth" && parts[1] === "profile" && method === "PUT") {
        return await handleUserProfileUpdate(db, request, origin, env.JWT_SECRET);
      }
      if (parts[0] === "auth" && parts[1] === "forgot-password" && method === "POST") {
        return await handleForgotPassword(db, request, origin, env);
      }
      if (parts[0] === "auth" && parts[1] === "reset-password" && method === "POST") {
        return await handleResetPassword(db, request, origin, env);
      }
    }
    if (parts[0] === "admin") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session || session.role !== "ADMIN" && session.role !== "STAFF") {
        return errorResponse("Unauthorized", 401, origin);
      }
      if (parts[1] === "stats" && method === "GET") {
        return await handleAdminStats(db, origin);
      }
      if (parts[1] === "schools" && parts.length === 2 && method === "GET") {
        return await handleAdminSchools(db, origin);
      }
      if (parts[1] === "schools" && parts.length === 3 && method === "GET") {
        return await handleAdminSchoolDetail(db, parts[2], origin);
      }
      if (parts[1] === "schools" && parts[3] === "create" && method === "POST") {
        return await handleCreateSchool(db, request, origin);
      }
      if (parts[1] === "payments" && method === "GET") {
        return await handleAdminPayments(db, origin);
      }
      if (parts[1] === "audit" && method === "GET") {
        return await handleAdminAudit(db, origin);
      }
      if (parts[1] === "plans" && method === "GET") {
        return await handleAdminPlans(db, origin);
      }
      if (parts[1] === "plans" && method === "POST") {
        return await handleSaveAdminPlan(db, request, session, origin);
      }
      if (parts[1] === "licenses" && method === "PUT") {
        return await handleUpdateLicense(db, request, origin, env);
      }
      if (parts[1] === "coupons" && method === "GET") {
        return await handleAdminCoupons(db, origin);
      }
      if (parts[1] === "coupons" && method === "POST") {
        return await handleCreateCoupon(db, request, origin);
      }
      if (parts[1] === "announcements" && method === "GET") {
        return await handleAdminAnnouncements(db, origin);
      }
      if (parts[1] === "announcements" && method === "POST") {
        return await handleCreateAnnouncement(db, request, session, origin);
      }
      if (parts[1] === "announcements" && parts.length === 3 && method === "DELETE") {
        return await handleDeleteAnnouncement(db, parts[2], origin);
      }
      if (parts[1] === "settings" && method === "GET") {
        return await handleAdminSettings(db, origin);
      }
      if (parts[1] === "settings" && method === "PUT") {
        return await handleSaveAdminSettings(db, request, origin);
      }
      if (parts[1] === "maintenance" && method === "GET") {
        return await handleAdminMaintenance(db, origin);
      }
      if (parts[1] === "maintenance" && method === "PUT") {
        return await handleSaveAdminMaintenance(db, request, origin);
      }
      if (parts[1] === "users" && method === "GET") {
        return await handleAdminUsers(db, origin);
      }
    }
    if (parts[0] === "teacher") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session || session.role !== "TEACHER") {
        return errorResponse("Unauthorized", 401, origin);
      }
      if (session.schoolId) {
        const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
        if (school && school.plan === "TRIAL" && school.trialEndsAt && new Date(school.trialEndsAt) < /* @__PURE__ */ new Date()) {
          return errorResponse("School trial has expired. Access restricted.", 403, origin);
        }
      }
      if (parts[1] === "api" && parts[2] === "classes" && method === "GET") {
        return await handleTeacherClasses(db, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "stats" && method === "GET") {
        return await handleGetTeacherStats(db, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "students" && method === "GET") {
        return await handleTeacherStudents(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "session" && method === "GET") {
        return await handleGetAttendanceSession(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "session" && method === "PUT") {
        return await handleSaveAttendanceSession(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "submit" && method === "POST") {
        return await handleSubmitAttendance(db, parts[4], origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "history" && method === "GET") {
        return await handleAttendanceHistory(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "profile" && method === "PUT") {
        return await handleUserProfileUpdate(db, request, origin, env.JWT_SECRET);
      }
      if (parts[1] === "api" && parts[2] === "scores" && method === "GET") {
        return await handleGetTeacherScores(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "scores" && method === "PUT") {
        return await handleSaveTeacherScores(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "comments" && method === "GET") {
        return await handleGetTeacherComments(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "comments" && method === "PUT") {
        return await handleSaveTeacherComments(db, request, session, origin);
      }
    }
    if (parts[0] === "school" || parts[0] === "students" || parts[0] === "teachers" || parts[0] === "parents" || parts[0] === "student-users" || parts[0] === "student-links" || parts[0] === "scores" || parts[0] === "report-extras" || parts[0] === "reports" || parts[0] === "ai-command" || parts[0] === "billing") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session || session.role !== "SCHOOL") {
        return errorResponse("Unauthorized", 401, origin);
      }
      if (session.schoolId && parts[0] !== "billing") {
        const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
        if (school && school.plan === "TRIAL" && school.trialEndsAt && new Date(school.trialEndsAt) < /* @__PURE__ */ new Date()) {
          return errorResponse("School trial has expired. Access restricted. Please upgrade your plan.", 403, origin);
        }
      }
      if (parts[0] === "school" && parts[1] === "attendance" && method === "GET") return await handleAdminAttendance(db, request, session, origin);
      if (parts[0] === "school" && method === "GET") return await handleGetSchool(db, session, origin);
      if (parts[0] === "school" && method === "PUT") return await handleUpdateSchool(db, request, session, origin);
      if (parts[0] === "billing" && parts[1] === "checkout" && method === "POST") return await handleSchoolBillingCheckout(db, request, session, origin);
      if (parts[0] === "billing" && parts[1] === "verify" && method === "POST") return await handleSchoolBillingVerify(db, request, session, env, origin);
      if (parts[0] === "students" && method === "GET") return await handleGetStudents(db, session, origin);
      if (parts[0] === "students" && method === "POST") return await handleCreateStudent(db, request, session, origin);
      if (parts[0] === "students" && parts[1] === "bulk" && method === "POST") return await handleBulkImportStudents(db, request, session, origin);
      if (parts[0] === "students" && parts.length === 2 && method === "DELETE") return await handleDeleteStudent(db, parts[1], session, origin);
      if (parts[0] === "students" && parts.length === 2 && method === "PUT") return await handleUpdateStudent(db, request, parts[1], session, origin);
      if (parts[0] === "ai-command" && method === "POST") return await handleAdminAICommand(db, request, session, env, origin);
      if (parts[0] === "teachers" && method === "GET") return await handleGetTeachers(db, session, origin);
      if (parts[0] === "teachers" && method === "POST") return await handleCreateTeacher(db, request, session, origin, env);
      if (parts[0] === "teachers" && parts.length === 2 && method === "DELETE") return await handleDeleteTeacher(db, parts[1], session, origin);
      if (parts[0] === "parents" && method === "GET") return await handleGetParents(db, session, origin);
      if (parts[0] === "parents" && method === "POST") return await handleCreateParent(db, request, session, origin, env);
      if (parts[0] === "parents" && parts.length === 2 && method === "DELETE") return await handleDeleteParent(db, parts[1], session, origin);
      if (parts[0] === "student-users" && method === "POST") return await handleCreateStudentUser(db, request, session, origin, env);
      if (parts[0] === "student-links" && method === "POST") return await handleCreateStudentLink(db, request, session, origin);
      if (parts[0] === "student-links" && parts.length === 2 && method === "DELETE") return await handleDeleteStudentLink(db, parts[1], session, origin);
      if (parts[0] === "scores" && method === "GET") return await handleGetScoresAdmin(db, request, session, origin);
      if (parts[0] === "scores" && parts.length === 2 && method === "PUT") return await handleUpdateScoreAdmin(db, request, parts[1], session, origin);
      if (parts[0] === "report-extras" && parts.length === 2 && method === "GET") return await handleGetReportExtras(db, parts[1], session, origin);
      if (parts[0] === "report-extras" && parts.length === 2 && method === "PUT") return await handleUpdateReportExtras(db, request, parts[1], session, origin);
    }
    if (parts[0] === "portal") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session || session.role !== "PARENT" && session.role !== "STUDENT" && session.role !== "SCHOOL") {
        return errorResponse("Unauthorized", 401, origin);
      }
      if (parts[1] === "api" && parts[2] === "me" && method === "GET") {
        return await handlePortalMe(db, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "student" && parts.length === 4 && method === "GET") {
        return await handlePortalStudent(db, parts[3], session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "summary" && method === "GET") {
        return await handlePortalAttendanceSummary(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "days" && method === "GET") {
        return await handlePortalAttendanceDays(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "scores" && parts.length === 4 && method === "GET") {
        return await handlePortalScores(db, parts[3], session, origin);
      }
      if (parts[1] === "api" && parts[2] === "report-extras" && parts.length === 4 && method === "GET") {
        return await handleGetReportExtras(db, parts[3], session, origin);
      }
      if (parts[1] === "api" && parts[2] === "settings" && method === "PUT") {
        return await handleUserProfileUpdate(db, request, origin, env.JWT_SECRET);
      }
    }
    if (parts[0] === "ai") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session) return errorResponse("Unauthorized", 401, origin);
      if (parts[1] === "exam" && parts.length === 2 && method === "GET") return await handleGetExams(db, session, origin);
      if (parts[1] === "exam" && parts.length === 2 && method === "POST") return await handleCreateCustomExam(db, request, session, origin);
      if (parts[1] === "exam" && parts[2] === "shared" && method === "GET") return await handleGetSharedExams(db, origin);
      if (parts[1] === "exam" && parts[2] === "import" && method === "POST") return await handleImportExam(db, request, session, env, origin);
      if (parts[1] === "exam" && method === "POST" && parts[2] === "generate") return await handleGenerateExam(db, request, session, env, origin);
      if (parts[1] === "exam" && parts.length === 3 && method === "GET") return await handleGetExamDetail(db, parts[2], session, origin);
      if (parts[1] === "exam" && parts.length === 3 && method === "PUT") return await handleUpdateExam(db, request, parts[2], session, env, origin);
      if (parts[1] === "exam" && parts.length === 3 && method === "DELETE") return await handleDeleteExam(db, parts[2], session, origin);
      if (parts[1] === "remarks" && method === "POST") return await handleGenerateAiRemarks(db, request, session, env, origin);
    }
    return errorResponse(`Route not found: ${path}`, 404, origin);
  } catch (err) {
    console.error("API Error:", err);
    let message2 = err.message || "Internal server error";
    if (err.cause) {
      message2 += ` (Cause: ${err.cause.message || err.cause})`;
    }
    return errorResponse(message2, 500, origin);
  }
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
async function authenticateRequest(request, secret) {
  const authHeader = request.headers.get("Authorization");
  let token = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookie = request.headers.get("Cookie") || "";
    const match2 = cookie.match(/(?:^|;\s*)token=([^;]*)/);
    if (match2) token = decodeURIComponent(match2[1]);
  }
  if (!token) return null;
  return verifyToken(token, secret);
}
__name(authenticateRequest, "authenticateRequest");
__name2(authenticateRequest, "authenticateRequest");
function generateId() {
  return crypto.randomUUID();
}
__name(generateId, "generateId");
__name2(generateId, "generateId");
function nowISO() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowISO, "nowISO");
__name2(nowISO, "nowISO");
async function handleFileUpload(request, bucket, origin) {
  if (!bucket) return errorResponse("Storage bucket not configured", 500, origin);
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) return errorResponse("No file uploaded", 400, origin);
    const extension = file.name.split(".").pop() || "bin";
    const key = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    await bucket.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    return jsonResponse({ key, url: `/api/files/${key}` }, 200, origin);
  } catch (err) {
    console.error("Upload error:", err);
    return errorResponse("File upload failed", 500, origin);
  }
}
__name(handleFileUpload, "handleFileUpload");
__name2(handleFileUpload, "handleFileUpload");
async function handleFileDownload(bucket, key, origin) {
  if (!bucket) return errorResponse("Storage bucket not configured", 500, origin);
  const object = await bucket.get(key);
  if (!object) return errorResponse("File not found", 404, origin);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  return new Response(object.body, { headers });
}
__name(handleFileDownload, "handleFileDownload");
__name2(handleFileDownload, "handleFileDownload");
async function handleLogin(db, request, origin, secret) {
  const { email, password } = await request.json();
  if (!email || !password) return errorResponse("Email and password required", 400, origin);
  const user = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    displayName: users.displayName,
    status: users.status,
    schoolId: users.schoolId,
    passwordHash: users.passwordHash
  }).from(users).where(eq(users.email, email.toLowerCase())).get();
  if (!user) return errorResponse("Invalid credentials", 401, origin);
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return errorResponse("Invalid credentials", 401, origin);
  if (user.status !== "ACTIVE") return errorResponse("Account is suspended", 403, origin);
  await db.update(users).set({ lastLoginAt: nowISO() }).where(eq(users.id, user.id)).run();
  let schoolId = user.schoolId;
  let school = null;
  if (schoolId) {
    school = await db.select().from(schools).where(eq(schools.id, schoolId)).get();
  } else {
    school = await db.select().from(schools).where(eq(schools.ownerId, user.id)).get();
    schoolId = school?.id;
  }
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId
  };
  const token = await signToken(tokenPayload, secret);
  const resData = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName
    },
    school: school ? {
      id: school.id,
      name: school.name,
      plan: school.plan
    } : null,
    token
  };
  return new Response(JSON.stringify(resData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(handleLogin, "handleLogin");
__name2(handleLogin, "handleLogin");
async function handleCheckDomain(db, request, origin) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain");
  if (!domain) return errorResponse("Domain parameter is required", 400, origin);
  const existing = await db.select().from(schools).where(eq(schools.subdomain, domain.toLowerCase())).get();
  return jsonResponse({ available: !existing }, 200, origin);
}
__name(handleCheckDomain, "handleCheckDomain");
__name2(handleCheckDomain, "handleCheckDomain");
async function handleGetSchoolPublic(db, subdomain, origin) {
  const school = await db.select({
    name: schools.name,
    logoUrl: schools.logoUrl,
    abbr: schools.abbr,
    motto: schools.motto
  }).from(schools).where(eq(schools.subdomain, subdomain.toLowerCase())).get();
  if (!school) return errorResponse("School not found", 404, origin);
  return jsonResponse({ school }, 200, origin);
}
__name(handleGetSchoolPublic, "handleGetSchoolPublic");
__name2(handleGetSchoolPublic, "handleGetSchoolPublic");
async function handleRegister(db, request, origin, env) {
  const { schoolName, email, password, plan, subdomain, phone } = await request.json();
  if (!schoolName || !email || !password || !subdomain) {
    return errorResponse("School name, email, password, and URL are required", 400, origin);
  }
  const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existingUser) return errorResponse("Email already registered", 409, origin);
  const existingSchool = await db.select().from(schools).where(eq(schools.subdomain, subdomain.toLowerCase())).get();
  if (existingSchool) return errorResponse("School username already taken", 409, origin);
  const userId = generateId();
  const schoolId = generateId();
  const passwordHash = await hashPassword(password);
  const now = nowISO();
  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    role: "SCHOOL",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    phone: phone || null,
    schoolId
  }).run();
  const defaultGrades = JSON.stringify([
    { grade: "A", min: 75, max: 100, remark: "Excellent" },
    { grade: "B", min: 60, max: 74, remark: "Very Good" },
    { grade: "C", min: 50, max: 59, remark: "Good" },
    { grade: "D", min: 40, max: 49, remark: "Fair" },
    { grade: "F", min: 0, max: 39, remark: "Fail" }
  ]);
  const defaultSubjects = JSON.stringify([
    "Mathematics",
    "English Language",
    "Basic Science",
    "Basic Technology",
    "Civic Education",
    "Social Studies",
    "Agricultural Science",
    "Computer Studies"
  ]);
  const defaultClasses = JSON.stringify([
    "JSS 1A",
    "JSS 1B",
    "JSS 2A",
    "JSS 2B",
    "JSS 3A",
    "JSS 3B",
    "SSS 1 Science",
    "SSS 1 Arts",
    "SSS 2 Science",
    "SSS 2 Arts",
    "SSS 3 Science",
    "SSS 3 Arts"
  ]);
  const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
  await db.insert(schools).values({
    id: schoolId,
    ownerId: userId,
    name: schoolName,
    abbr: schoolName.substring(0, 3).toUpperCase(),
    subdomain: subdomain.toLowerCase(),
    plan: (plan || "TRIAL").toUpperCase(),
    session: "2024/2025",
    term: "First Term",
    ca1Max: 10,
    ca2Max: 10,
    examMax: 80,
    subjects: defaultSubjects,
    classTemplates: defaultClasses,
    grades: defaultGrades,
    createdAt: now,
    updatedAt: now,
    currency: "NGN",
    reportColor: "#4f46e5",
    reportTemplate: "ELITE",
    trialEndsAt: trialEnds
  }).run();
  try {
    const mailer = new EmailService(env);
    const loginUrl = `https://${subdomain.toLowerCase()}.${env.NEXT_PUBLIC_MAIN_DOMAIN || "reportsheet.com.ng"}/login`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: `Welcome to ReportSheet - ${schoolName}`,
      html: EmailService.getWelcomeAdminTemplate(schoolName, loginUrl)
    });
  } catch (err) {
    console.error("Welcome email failed:", err);
  }
  const token = await signToken({
    userId,
    email: email.toLowerCase(),
    role: "SCHOOL",
    schoolId
  }, env.JWT_SECRET);
  return new Response(JSON.stringify({
    user: { id: userId, email, role: "SCHOOL" },
    school: { id: schoolId, name: schoolName, plan: (plan || "TRIAL").toUpperCase() },
    token,
    message: "Registration successful"
  }), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(handleRegister, "handleRegister");
__name2(handleRegister, "handleRegister");
async function handleLogout(origin) {
  return new Response(JSON.stringify({ message: "Logged out" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true"
    }
  });
}
__name(handleLogout, "handleLogout");
__name2(handleLogout, "handleLogout");
async function handleMe(db, request, origin, secret) {
  const session = await authenticateRequest(request, secret);
  if (!session) return errorResponse("Unauthorized", 401, origin);
  const user = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    displayName: users.displayName,
    phone: users.phone,
    status: users.status
  }).from(users).where(eq(users.id, session.userId)).get();
  if (!user) return errorResponse("User not found", 404, origin);
  let school = null;
  if (session.schoolId) {
    school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  } else {
    school = await db.select().from(schools).where(eq(schools.ownerId, user.id)).get();
  }
  return jsonResponse({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      phone: user.phone,
      status: user.status
    },
    school: school ? {
      id: school.id,
      name: school.name,
      plan: school.plan,
      session: school.session,
      term: school.term,
      ca1Max: school.ca1Max,
      ca2Max: school.ca2Max,
      examMax: school.examMax,
      motto: school.motto,
      address: school.address,
      logoUrl: school.logoUrl
    } : null
  }, 200, origin);
}
__name(handleMe, "handleMe");
__name2(handleMe, "handleMe");
async function handleChangePassword(db, request, origin, secret) {
  const session = await authenticateRequest(request, secret);
  if (!session) return errorResponse("Unauthorized", 401, origin);
  const { oldPassword, newPassword } = await request.json();
  if (!oldPassword || !newPassword) return errorResponse("Old and new passwords required", 400, origin);
  const user = await db.select({
    id: users.id,
    passwordHash: users.passwordHash
  }).from(users).where(eq(users.id, session.userId)).get();
  if (!user) return errorResponse("User not found", 404, origin);
  const valid = await verifyPassword(oldPassword, user.passwordHash);
  if (!valid) return errorResponse("Current password is incorrect", 403, origin);
  const newHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newHash, updatedAt: nowISO() }).where(eq(users.id, user.id)).run();
  return jsonResponse({ message: "Password changed successfully" }, 200, origin);
}
__name(handleChangePassword, "handleChangePassword");
__name2(handleChangePassword, "handleChangePassword");
async function handleUserProfileUpdate(db, request, origin, secret) {
  const session = await authenticateRequest(request, secret);
  if (!session) return errorResponse("Unauthorized", 401, origin);
  const { displayName, email, phone } = await request.json();
  if (!displayName || !email) return errorResponse("Display name and email required", 400, origin);
  if (email.toLowerCase() !== session.email.toLowerCase()) {
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
    if (existing) return errorResponse("Email already in use", 409, origin);
  }
  await db.update(users).set({
    displayName,
    email: email.toLowerCase(),
    phone: phone || null,
    updatedAt: nowISO()
  }).where(eq(users.id, session.userId)).run();
  if (session.role === "TEACHER") {
    const profile = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, session.userId)).get();
    if (profile) {
      await db.update(teacherProfiles).set({ displayName, updatedAt: nowISO() }).where(eq(teacherProfiles.id, profile.id)).run();
    }
  }
  return jsonResponse({ success: true, message: "Profile updated" }, 200, origin);
}
__name(handleUserProfileUpdate, "handleUserProfileUpdate");
__name2(handleUserProfileUpdate, "handleUserProfileUpdate");
async function handleForgotPassword(db, request, origin, env) {
  const { email } = await request.json();
  if (!email) return errorResponse("Email required", 400, origin);
  const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (!user) return jsonResponse({ success: true, message: "If an account exists, a reset link has been sent." }, 200, origin);
  const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");
  const tokenHash = await hashPassword(resetToken);
  const expiresAt = new Date(Date.now() + 36e5).toISOString();
  await db.insert(passwordResets).values({
    id: generateId(),
    userId: user.id,
    tokenHash,
    expiresAt,
    createdAt: nowISO()
  }).run();
  try {
    const mailer = new EmailService(env);
    const resetUrl = `https://${env.NEXT_PUBLIC_MAIN_DOMAIN || "reportsheet.com.ng"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: "Password Reset Request - ReportSheet",
      html: EmailService.getPasswordResetTemplate(user.displayName || "User", resetUrl)
    });
  } catch (err) {
    console.error("Reset email failed:", err);
  }
  return jsonResponse({ success: true, message: "If an account exists, a reset link has been sent." }, 200, origin);
}
__name(handleForgotPassword, "handleForgotPassword");
__name2(handleForgotPassword, "handleForgotPassword");
async function handleResetPassword(db, request, origin, env) {
  const { email, token, newPassword } = await request.json();
  if (!email || !token || !newPassword) return errorResponse("All fields required", 400, origin);
  const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (!user) return errorResponse("Invalid request", 400, origin);
  const resets = await db.select().from(passwordResets).where(and(eq(passwordResets.userId, user.id), sql`used_at IS NULL`)).all();
  let validReset = null;
  for (const r of resets) {
    if (new Date(r.expiresAt) < /* @__PURE__ */ new Date()) continue;
    if (await verifyPassword(token, r.tokenHash)) {
      validReset = r;
      break;
    }
  }
  if (!validReset) return errorResponse("Invalid or expired token", 400, origin);
  const newHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newHash, updatedAt: nowISO() }).where(eq(users.id, user.id)).run();
  await db.update(passwordResets).set({ usedAt: nowISO() }).where(eq(passwordResets.id, validReset.id)).run();
  return jsonResponse({ success: true, message: "Password updated successfully" }, 200, origin);
}
__name(handleResetPassword, "handleResetPassword");
__name2(handleResetPassword, "handleResetPassword");
async function handleAdminStats(db, origin) {
  const schoolsTotal = await db.select({ count: sql`COUNT(*)` }).from(schools).get();
  const studentsTotal = await db.select({ count: sql`COUNT(*)` }).from(students).get();
  const schoolsActive = await db.select({ count: sql`COUNT(*)` }).from(schools).where(sql`plan != 'TRIAL'`).get();
  const revenueRow = await db.select({ sum: sql`SUM(amount_kobo)` }).from(payments).where(eq(payments.status, "SUCCESS")).get();
  return jsonResponse({
    stats: {
      schoolsTotal: schoolsTotal?.count || 0,
      schoolsActive: schoolsActive?.count || 0,
      studentsTotal: studentsTotal?.count || 0,
      revenue: (revenueRow?.sum || 0) / 100
    }
  }, 200, origin);
}
__name(handleAdminStats, "handleAdminStats");
__name2(handleAdminStats, "handleAdminStats");
async function handleAdminSchools(db, origin) {
  const schoolsList = await db.select({
    id: schools.id,
    name: schools.name,
    plan: schools.plan,
    createdAt: schools.createdAt,
    ownerEmail: users.email
  }).from(schools).leftJoin(users, eq(schools.ownerId, users.id)).orderBy(desc(schools.createdAt)).all();
  return jsonResponse({ schools: schoolsList }, 200, origin);
}
__name(handleAdminSchools, "handleAdminSchools");
__name2(handleAdminSchools, "handleAdminSchools");
async function handleAdminSchoolDetail(db, schoolId, origin) {
  const school = await db.select().from(schools).where(eq(schools.id, schoolId)).get();
  if (!school) return errorResponse("School not found", 404, origin);
  const owner = await db.select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    role: users.role,
    status: users.status
  }).from(users).where(eq(users.id, school.ownerId)).get();
  const studentCount = await db.select({ count: sql`COUNT(*)` }).from(students).where(eq(students.schoolId, schoolId)).get();
  return jsonResponse({
    school: {
      ...school,
      owner,
      studentCount: studentCount?.count || 0
    }
  }, 200, origin);
}
__name(handleAdminSchoolDetail, "handleAdminSchoolDetail");
__name2(handleAdminSchoolDetail, "handleAdminSchoolDetail");
async function handleAdminPayments(db, origin) {
  const transactions = await db.select({
    id: payments.id,
    schoolName: schools.name,
    amountKobo: payments.amountKobo,
    provider: payments.provider,
    status: payments.status,
    createdAt: payments.createdAt,
    reference: payments.reference
  }).from(payments).leftJoin(schools, eq(payments.schoolId, schools.id)).orderBy(desc(payments.createdAt)).all();
  return jsonResponse({ transactions }, 200, origin);
}
__name(handleAdminPayments, "handleAdminPayments");
__name2(handleAdminPayments, "handleAdminPayments");
async function handleAdminAudit(db, origin) {
  const logs = await db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    data: auditLogs.data,
    createdAt: auditLogs.createdAt,
    userEmail: users.email
  }).from(auditLogs).leftJoin(users, eq(auditLogs.actorUserId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(100).all();
  return jsonResponse({ logs }, 200, origin);
}
__name(handleAdminAudit, "handleAdminAudit");
__name2(handleAdminAudit, "handleAdminAudit");
async function handleAdminPlans(db, origin) {
  const settings = await db.select().from(systemSettings).where(like(systemSettings.k, "plan_%")).all();
  return jsonResponse({ settings }, 200, origin);
}
__name(handleAdminPlans, "handleAdminPlans");
__name2(handleAdminPlans, "handleAdminPlans");
async function handleSaveAdminPlan(db, request, session, origin) {
  const { k, v } = await request.json();
  if (!k || !v) return errorResponse("Key and value required", 400, origin);
  await db.insert(systemSettings).values({
    k,
    v,
    updatedAt: nowISO(),
    updatedByUserId: session.userId
  }).onConflictDoUpdate({
    target: systemSettings.k,
    set: { v, updatedAt: nowISO(), updatedByUserId: session.userId }
  }).run();
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleSaveAdminPlan, "handleSaveAdminPlan");
__name2(handleSaveAdminPlan, "handleSaveAdminPlan");
async function handleUpdateLicense(db, request, origin, env) {
  const { schoolId, plan, amount, reference } = await request.json();
  if (!schoolId || !plan) return errorResponse("schoolId and plan required", 400, origin);
  await db.update(schools).set({
    plan: plan.toUpperCase(),
    updatedAt: nowISO()
  }).where(eq(schools.id, schoolId)).run();
  try {
    const school = await db.select().from(schools).where(eq(schools.id, schoolId)).get();
    if (school) {
      const owner = await db.select().from(users).where(eq(users.id, school.ownerId)).get();
      if (owner) {
        const mailer = new EmailService(env);
        await mailer.send({
          to: owner.email,
          subject: `Payment Successful - ${school.name}`,
          html: EmailService.getPaymentSuccessTemplate(school.name, plan.toUpperCase(), amount || "N/A", reference || "Admin Update")
        });
      }
    }
  } catch (err) {
    console.error("Payment email failed:", err);
  }
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleUpdateLicense, "handleUpdateLicense");
__name2(handleUpdateLicense, "handleUpdateLicense");
async function handleAdminCoupons(db, origin) {
  const row = await db.select().from(systemSettings).where(eq(systemSettings.k, "admin_coupons")).get();
  const coupons = row ? JSON.parse(row.v) : [];
  return jsonResponse({ coupons }, 200, origin);
}
__name(handleAdminCoupons, "handleAdminCoupons");
__name2(handleAdminCoupons, "handleAdminCoupons");
async function handleCreateCoupon(db, request, origin) {
  const coupon = await request.json();
  const row = await db.select().from(systemSettings).where(eq(systemSettings.k, "admin_coupons")).get();
  const coupons = row ? JSON.parse(row.v) : [];
  coupons.push({ ...coupon, id: generateId(), createdAt: nowISO() });
  await db.insert(systemSettings).values({
    k: "admin_coupons",
    v: JSON.stringify(coupons),
    updatedAt: nowISO()
  }).onConflictDoUpdate({
    target: systemSettings.k,
    set: { v: JSON.stringify(coupons), updatedAt: nowISO() }
  }).run();
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleCreateCoupon, "handleCreateCoupon");
__name2(handleCreateCoupon, "handleCreateCoupon");
async function handleCreateSchool(db, request, origin) {
  const { schoolName, email, phone, plan, address, subdomain, logoUrl } = await request.json();
  if (!schoolName || !email) return errorResponse("School name and email required", 400, origin);
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existing) return errorResponse("Email already exists", 409, origin);
  const userId = generateId();
  const schoolId = generateId();
  const password = Math.random().toString(36).slice(-12);
  const passwordHash = await hashPassword(password);
  const now = nowISO();
  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    role: "SCHOOL",
    status: "ACTIVE",
    forcePasswordChange: true,
    createdAt: now,
    updatedAt: now
  }).run();
  await db.insert(schools).values({
    id: schoolId,
    ownerId: userId,
    name: schoolName,
    abbr: schoolName.slice(0, 3).toUpperCase(),
    address: address || null,
    contact: phone || null,
    plan: (plan || "LIFETIME").toUpperCase(),
    subjects: "[]",
    grades: "[]",
    subdomain: subdomain || null,
    logoUrl: logoUrl || null,
    createdAt: now,
    updatedAt: now
  }).run();
  return jsonResponse({
    school: { id: schoolId, name: schoolName },
    temporaryPassword: password
  }, 201, origin);
}
__name(handleCreateSchool, "handleCreateSchool");
__name2(handleCreateSchool, "handleCreateSchool");
async function handleTeacherClasses(db, session, origin) {
  const assignments = await db.select({
    className: teacherClassAssignments.className
  }).from(teacherClassAssignments).where(
    and(
      eq(teacherClassAssignments.teacherUserId, session.userId),
      eq(teacherClassAssignments.schoolId, session.schoolId)
    )
  ).all();
  const classes = [...new Set(assignments.map((a) => a.className))];
  return jsonResponse({ classes: classes.map((name) => ({ name })) }, 200, origin);
}
__name(handleTeacherClasses, "handleTeacherClasses");
__name2(handleTeacherClasses, "handleTeacherClasses");
async function handleGetTeacherStats(db, session, origin) {
  const assignments = await db.select({ className: teacherClassAssignments.className }).from(teacherClassAssignments).where(eq(teacherClassAssignments.teacherUserId, session.userId)).all();
  const classNames = assignments.map((a) => a.className);
  if (classNames.length === 0) {
    return jsonResponse({ totalStudents: 0, attendanceRate: 0, scoresCompletion: 0, stats: [], topAchievers: [] }, 200, origin);
  }
  const students2 = await db.select({ id: students.id, name: students.name }).from(students).where(and(eq(students.schoolId, session.schoolId), inArray(students.className, classNames))).all();
  const studentIds = students2.map((s) => s.id);
  const studentNameMap = /* @__PURE__ */ new Map();
  students2.forEach((s) => studentNameMap.set(s.id, s.name));
  if (studentIds.length === 0) {
    return jsonResponse({ totalStudents: 0, attendanceRate: 0, scoresCompletion: 0, stats: [], topAchievers: [] }, 200, origin);
  }
  const scoreSheets2 = await db.select({ studentId: scoreSheets.studentId, data: scoreSheets.data }).from(scoreSheets).where(and(eq(scoreSheets.schoolId, session.schoolId), inArray(scoreSheets.studentId, studentIds))).all();
  const scoresCompletion = Math.round(scoreSheets2.length / studentIds.length * 100);
  let totalGradeSum = 0;
  let gradeCount = 0;
  const studentScoresList = [];
  for (const sheet of scoreSheets2) {
    try {
      const data = JSON.parse(sheet.data);
      let subjectCount = 0;
      let subjectSum = 0;
      for (const subKey of Object.keys(data)) {
        const subData = data[subKey];
        const score = (Number(subData.ca1) || 0) + (Number(subData.ca2) || 0) + (Number(subData.exam) || 0);
        subjectSum += score;
        subjectCount++;
      }
      if (subjectCount > 0) {
        const avg = subjectSum / subjectCount;
        totalGradeSum += avg;
        gradeCount++;
        const name = studentNameMap.get(sheet.studentId) || "Student";
        studentScoresList.push({ name, average: Math.round(avg * 10) / 10 });
      }
    } catch (e) {
    }
  }
  const averageGradeVal = gradeCount > 0 ? Math.round(totalGradeSum / gradeCount) : 0;
  const thirtyDaysAgo = /* @__PURE__ */ new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
  const marks = await db.select({ mark: attendanceMarks.mark }).from(attendanceMarks).innerJoin(attendanceSessions, eq(attendanceMarks.attendanceSessionId, attendanceSessions.id)).where(and(
    inArray(attendanceMarks.studentId, studentIds),
    gte(attendanceSessions.sessionDate, thirtyDaysAgoStr)
  )).all();
  const presentCount = marks.filter((m) => m.mark === "PRESENT" || m.mark === "LATE").length;
  const attendanceRate = marks.length > 0 ? Math.round(presentCount / marks.length * 100) : 0;
  const avgGradeStr = averageGradeVal > 0 ? `${averageGradeVal}%` : "No scores";
  const stats = [
    { label: "Average Grade", val: avgGradeStr, trend: "Overall class average", neutral: true },
    { label: "Avg Attendance", val: `${attendanceRate}%`, trend: "Last 30 days", neutral: true },
    { label: "Engagement", val: `${scoresCompletion}%`, trend: "Scores entered", neutral: true },
    { label: "Next Deadline", val: "End of Term", trend: "Check schedule", info: true }
  ];
  studentScoresList.sort((a, b) => b.average - a.average);
  const topAchievers = studentScoresList.slice(0, 5).map((item, idx) => ({
    name: item.name,
    score: item.average,
    trend: "+0.0",
    pos: idx + 1
  }));
  return jsonResponse({
    totalStudents: studentIds.length,
    attendanceRate,
    scoresCompletion,
    stats,
    topAchievers
  }, 200, origin);
}
__name(handleGetTeacherStats, "handleGetTeacherStats");
__name2(handleGetTeacherStats, "handleGetTeacherStats");
async function handleTeacherStudents(db, request, session, origin) {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  if (!className) return errorResponse("className required", 400, origin);
  const assignment = await db.select({ id: teacherClassAssignments.id }).from(teacherClassAssignments).where(
    and(
      eq(teacherClassAssignments.teacherUserId, session.userId),
      eq(teacherClassAssignments.schoolId, session.schoolId),
      eq(teacherClassAssignments.className, className)
    )
  ).get();
  if (!assignment) return errorResponse("Not authorized for this class", 403, origin);
  const students2 = await db.select({
    id: students.id,
    name: students.name,
    admNo: students.admissionNo,
    cls: students.className
  }).from(students).where(
    and(
      eq(students.schoolId, session.schoolId),
      eq(students.className, className)
    )
  ).orderBy(asc(students.name)).all();
  return jsonResponse({ students: students2 }, 200, origin);
}
__name(handleTeacherStudents, "handleTeacherStudents");
__name2(handleTeacherStudents, "handleTeacherStudents");
async function handleGetAttendanceSession(db, request, session, origin) {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  const date = url.searchParams.get("date");
  if (!className || !date) return errorResponse("className and date required", 400, origin);
  let sessionRecord = await db.select().from(attendanceSessions).where(
    and(
      eq(attendanceSessions.schoolId, session.schoolId),
      eq(attendanceSessions.className, className),
      eq(attendanceSessions.sessionDate, new Date(date).toISOString().split("T")[0])
    )
  ).get();
  if (!sessionRecord) {
    return jsonResponse({ session: null, marks: [] }, 200, origin);
  }
  const marks = await db.select().from(attendanceMarks).where(eq(attendanceMarks.attendanceSessionId, sessionRecord.id)).all();
  return jsonResponse({
    session: sessionRecord,
    marks: marks.map((m) => ({
      studentId: m.studentId,
      mark: m.mark,
      note: m.note || ""
    }))
  }, 200, origin);
}
__name(handleGetAttendanceSession, "handleGetAttendanceSession");
__name2(handleGetAttendanceSession, "handleGetAttendanceSession");
async function handleSaveAttendanceSession(db, request, session, origin) {
  const { className, date, marks } = await request.json();
  if (!className || !date || !marks) return errorResponse("className, date, and marks required", 400, origin);
  const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  if (!school) return errorResponse("School not found", 404, origin);
  const sessionDateStr = new Date(date).toISOString().split("T")[0];
  let sessionRecord = await db.select().from(attendanceSessions).where(
    and(
      eq(attendanceSessions.schoolId, session.schoolId),
      eq(attendanceSessions.className, className),
      eq(attendanceSessions.sessionDate, sessionDateStr)
    )
  ).get();
  if (!sessionRecord) {
    const id = generateId();
    await db.insert(attendanceSessions).values({
      id,
      schoolId: session.schoolId,
      className,
      sessionDate: sessionDateStr,
      session: school.session || "",
      term: school.term || "",
      takenByUserId: session.userId,
      status: "DRAFT",
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
    sessionRecord = await db.select().from(attendanceSessions).where(eq(attendanceSessions.id, id)).get();
  }
  if (sessionRecord.status === "SUBMITTED") {
    return errorResponse("Session already submitted", 403, origin);
  }
  await db.delete(attendanceMarks).where(eq(attendanceMarks.attendanceSessionId, sessionRecord.id)).run();
  for (const mark of marks) {
    if (mark.mark) {
      await db.insert(attendanceMarks).values({
        id: generateId(),
        schoolId: session.schoolId,
        attendanceSessionId: sessionRecord.id,
        studentId: mark.studentId,
        mark: mark.mark,
        note: mark.note || null,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }).run();
    }
  }
  await db.update(attendanceSessions).set({ updatedAt: nowISO() }).where(eq(attendanceSessions.id, sessionRecord.id)).run();
  return jsonResponse({ session: sessionRecord, message: "Saved" }, 200, origin);
}
__name(handleSaveAttendanceSession, "handleSaveAttendanceSession");
__name2(handleSaveAttendanceSession, "handleSaveAttendanceSession");
async function handleSubmitAttendance(db, sessionId, origin) {
  if (!sessionId) return errorResponse("Session ID required", 400, origin);
  let sessionRecord = await db.select().from(attendanceSessions).where(eq(attendanceSessions.id, sessionId)).get();
  if (!sessionRecord) return errorResponse("Session not found", 404, origin);
  if (sessionRecord.status === "SUBMITTED") return errorResponse("Already submitted", 403, origin);
  await db.update(attendanceSessions).set({ status: "SUBMITTED", updatedAt: nowISO() }).where(eq(attendanceSessions.id, sessionId)).run();
  return jsonResponse({ message: "Submitted" }, 200, origin);
}
__name(handleSubmitAttendance, "handleSubmitAttendance");
__name2(handleSubmitAttendance, "handleSubmitAttendance");
async function handleAttendanceHistory(db, request, session, origin) {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!className) return errorResponse("className required", 400, origin);
  const sessions = await db.select().from(attendanceSessions).where(
    and(
      eq(attendanceSessions.schoolId, session.schoolId),
      eq(attendanceSessions.className, className),
      from ? gte(attendanceSessions.sessionDate, from) : void 0,
      to ? lte(attendanceSessions.sessionDate, to) : void 0
    )
  ).orderBy(desc(attendanceSessions.sessionDate)).all();
  return jsonResponse({ sessions }, 200, origin);
}
__name(handleAttendanceHistory, "handleAttendanceHistory");
__name2(handleAttendanceHistory, "handleAttendanceHistory");
async function handleGetTeacherScores(db, request, session, origin) {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  if (!className) return errorResponse("className required", 400, origin);
  const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  const qSession = url.searchParams.get("session") || school?.session || "";
  const qTerm = url.searchParams.get("term") || school?.term || "";
  const students2 = await db.select().from(students).where(and(eq(students.schoolId, session.schoolId), eq(students.className, className))).all();
  const scores = await db.select().from(scoreSheets).where(and(
    eq(scoreSheets.schoolId, session.schoolId),
    eq(scoreSheets.session, qSession),
    eq(scoreSheets.term, qTerm)
  )).all();
  const extrasRows = await db.select().from(reportExtras).where(and(
    eq(reportExtras.schoolId, session.schoolId),
    eq(reportExtras.session, qSession),
    eq(reportExtras.term, qTerm)
  )).all();
  const attendanceRows = await db.select({
    studentId: attendanceMarks.studentId,
    mark: attendanceMarks.mark
  }).from(attendanceMarks).innerJoin(attendanceSessions, eq(attendanceMarks.attendanceSessionId, attendanceSessions.id)).where(and(
    eq(attendanceSessions.schoolId, session.schoolId),
    eq(attendanceSessions.session, qSession),
    eq(attendanceSessions.term, qTerm),
    eq(attendanceSessions.status, "SUBMITTED")
  )).all();
  const attendanceStats = {};
  attendanceRows.forEach((r) => {
    if (!attendanceStats[r.studentId]) attendanceStats[r.studentId] = { present: 0, absent: 0, late: 0 };
    if (r.mark === "PRESENT") attendanceStats[r.studentId].present++;
    if (r.mark === "ABSENT") attendanceStats[r.studentId].absent++;
    if (r.mark === "LATE") attendanceStats[r.studentId].late++;
  });
  const reportExtras2 = {};
  extrasRows.forEach((r) => {
    try {
      reportExtras2[r.studentId] = {
        ...r,
        traits: JSON.parse(r.traits),
        comments: JSON.parse(r.comments)
      };
    } catch (e) {
      reportExtras2[r.studentId] = r;
    }
  });
  Object.keys(attendanceStats).forEach((studentId) => {
    const stats = attendanceStats[studentId];
    const total = stats.present + stats.absent + stats.late;
    const attended = stats.present + stats.late;
    if (total > 0) {
      const percentage = Math.round(attended / total * 100);
      const autoAttendance = `${percentage}% (${attended}/${total})`;
      if (reportExtras2[studentId]) {
        reportExtras2[studentId].attendance = autoAttendance;
      } else {
        reportExtras2[studentId] = { attendance: autoAttendance, traits: {}, comments: {} };
      }
    }
  });
  return jsonResponse({ students: students2, scores, reportExtras: reportExtras2 }, 200, origin);
}
__name(handleGetTeacherScores, "handleGetTeacherScores");
__name2(handleGetTeacherScores, "handleGetTeacherScores");
async function handleSaveTeacherScores(db, request, session, origin) {
  const body = await request.json();
  const { scores, session: reqSession, term: reqTerm } = body;
  if (!Array.isArray(scores)) return errorResponse("scores array required", 400, origin);
  const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  const qSession = reqSession || school?.session || "";
  const qTerm = reqTerm || school?.term || "";
  for (const s of scores) {
    const existing = await db.select().from(scoreSheets).where(and(
      eq(scoreSheets.studentId, s.studentId),
      eq(scoreSheets.schoolId, session.schoolId),
      eq(scoreSheets.session, qSession),
      eq(scoreSheets.term, qTerm)
    )).get();
    if (existing) {
      await db.update(scoreSheets).set({ data: JSON.stringify(s.data), updatedAt: nowISO() }).where(eq(scoreSheets.id, existing.id)).run();
    } else {
      await db.insert(scoreSheets).values({
        id: generateId(),
        schoolId: session.schoolId,
        studentId: s.studentId,
        session: qSession,
        term: qTerm,
        data: JSON.stringify(s.data),
        createdAt: nowISO(),
        updatedAt: nowISO()
      }).run();
    }
  }
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleSaveTeacherScores, "handleSaveTeacherScores");
__name2(handleSaveTeacherScores, "handleSaveTeacherScores");
async function handleGetTeacherComments(db, request, session, origin) {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  if (!className) return errorResponse("className required", 400, origin);
  const students2 = await db.select().from(students).where(and(eq(students.schoolId, session.schoolId), eq(students.className, className))).all();
  const extras = await db.select().from(reportExtras).where(eq(reportExtras.schoolId, session.schoolId)).all();
  return jsonResponse({ students: students2, extras }, 200, origin);
}
__name(handleGetTeacherComments, "handleGetTeacherComments");
__name2(handleGetTeacherComments, "handleGetTeacherComments");
async function handleSaveTeacherComments(db, request, session, origin) {
  const body = await request.json();
  const { comments } = body;
  if (!Array.isArray(comments)) return errorResponse("comments array required", 400, origin);
  for (const c of comments) {
    const existing = await db.select().from(reportExtras).where(and(eq(reportExtras.studentId, c.studentId), eq(reportExtras.schoolId, session.schoolId))).get();
    const data = {
      attendance: c.attendance || "0",
      traits: JSON.stringify(c.traits || {}),
      comments: JSON.stringify(c.comments || {}),
      promotion: c.promotion || "",
      updatedAt: nowISO()
    };
    if (existing) {
      await db.update(reportExtras).set(data).where(eq(reportExtras.id, existing.id)).run();
    } else {
      await db.insert(reportExtras).values({
        id: generateId(),
        schoolId: session.schoolId,
        studentId: c.studentId,
        session: "",
        // In a real app, get current session from school
        term: "",
        ...data,
        createdAt: nowISO()
      }).run();
    }
  }
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleSaveTeacherComments, "handleSaveTeacherComments");
__name2(handleSaveTeacherComments, "handleSaveTeacherComments");
async function handleGetSchool(db, session, origin) {
  const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  if (!school) return errorResponse("School not found", 404, origin);
  const s = { ...school };
  if (s.subjects) try {
    s.subjects = JSON.parse(s.subjects);
  } catch (e) {
    s.subjects = [];
  }
  if (s.grades) try {
    s.grades = JSON.parse(s.grades);
  } catch (e) {
    s.grades = [];
  }
  if (s.classTemplates) {
    try {
      const parsed = JSON.parse(s.classTemplates);
      s.classTemplates = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      s.classTemplates = [];
    }
  } else {
    s.classTemplates = [];
  }
  if (s.classArms) {
    try {
      const parsed = JSON.parse(s.classArms);
      s.classArms = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      s.classArms = [];
    }
  } else {
    s.classArms = [];
  }
  if (s.promotionLogic) {
    try {
      s.promotionLogic = JSON.parse(s.promotionLogic);
    } catch (e) {
      s.promotionLogic = { enabled: false, minAverage: 50, coreSubjects: [] };
    }
  } else {
    s.promotionLogic = { enabled: false, minAverage: 50, coreSubjects: [] };
  }
  return jsonResponse({ school: s }, 200, origin);
}
__name(handleGetSchool, "handleGetSchool");
__name2(handleGetSchool, "handleGetSchool");
async function handleUpdateSchool(db, request, session, origin) {
  const body = await request.json();
  const { name, abbr, address, contact, session: schoolSession, term, ca1Max, ca2Max, examMax, subjects, grades, motto, principal, logoUrl, reportColor, reportTemplate, nextTerm, classTemplates, classArms, promotionLogic } = body;
  await db.update(schools).set({
    name,
    abbr,
    address,
    contact,
    session: schoolSession,
    term,
    motto,
    principal,
    logoUrl,
    reportColor,
    reportTemplate,
    nextTerm,
    ca1Max: Number(ca1Max),
    ca2Max: Number(ca2Max),
    examMax: Number(examMax),
    subjects: subjects && typeof subjects === "object" ? JSON.stringify(subjects) : subjects,
    grades: grades && typeof grades === "object" ? JSON.stringify(grades) : grades,
    classTemplates: classTemplates && typeof classTemplates === "object" ? JSON.stringify(classTemplates) : classTemplates,
    classArms: classArms && typeof classArms === "object" ? JSON.stringify(classArms) : classArms,
    promotionLogic: promotionLogic && typeof promotionLogic === "object" ? JSON.stringify(promotionLogic) : promotionLogic,
    updatedAt: nowISO()
  }).where(eq(schools.id, session.schoolId)).run();
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleUpdateSchool, "handleUpdateSchool");
__name2(handleUpdateSchool, "handleUpdateSchool");
async function handleGetStudents(db, session, origin) {
  const students2 = await db.select().from(students).where(eq(students.schoolId, session.schoolId)).all();
  return jsonResponse({ students: students2 }, 200, origin);
}
__name(handleGetStudents, "handleGetStudents");
__name2(handleGetStudents, "handleGetStudents");
async function handleCreateStudent(db, request, session, origin) {
  const body = await request.json();
  const { name, cls, className, gender, admNo, admissionNo, photoUrl, dob, club, parentName, parentEmail, parentPhone } = body;
  const id = generateId();
  await db.insert(students).values({
    id,
    schoolId: session.schoolId,
    name,
    className: className || cls,
    gender,
    admissionNo: admissionNo || admNo || `ADM-${Date.now()}`,
    photoUrl: photoUrl || null,
    dob: dob || null,
    guardianName: parentName || null,
    guardianEmail: parentEmail || null,
    guardianPhone: parentPhone || null,
    profileExtra: JSON.stringify({ club: club || null }),
    createdAt: nowISO(),
    updatedAt: nowISO()
  }).run();
  if (parentEmail) {
    let parentUser = await db.select().from(users).where(eq(users.email, parentEmail)).get();
    let parentUserId = parentUser?.id;
    if (!parentUser) {
      parentUserId = generateId();
      const pwdHash = await hashPassword("Parent@123");
      await db.insert(users).values({
        id: parentUserId,
        email: parentEmail,
        displayName: parentName || "Parent",
        phone: parentPhone || null,
        passwordHash: pwdHash,
        role: "PARENT",
        forcePasswordChange: 1,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }).run();
    }
    const existingLink = await db.select().from(studentLinks).where(and(eq(studentLinks.studentId, id), eq(studentLinks.userId, parentUserId))).get();
    if (!existingLink) {
      await db.insert(studentLinks).values({
        id: generateId(),
        schoolId: session.schoolId,
        studentId: id,
        userId: parentUserId,
        linkType: "PARENT",
        createdAt: nowISO()
      }).run();
    }
  }
  return jsonResponse({ success: true, id }, 201, origin);
}
__name(handleCreateStudent, "handleCreateStudent");
__name2(handleCreateStudent, "handleCreateStudent");
async function handleUpdateStudent(db, request, studentId, session, origin) {
  const body = await request.json();
  const { name, cls, className, gender, admNo, admissionNo, photoUrl, dob, club, parentName, parentEmail, parentPhone } = body;
  await db.update(students).set({
    name,
    className: className || cls,
    gender,
    admissionNo: admissionNo || admNo,
    photoUrl: photoUrl !== void 0 ? photoUrl : null,
    dob: dob !== void 0 ? dob : null,
    guardianName: parentName !== void 0 ? parentName : null,
    guardianEmail: parentEmail !== void 0 ? parentEmail : null,
    guardianPhone: parentPhone !== void 0 ? parentPhone : null,
    profileExtra: club !== void 0 ? JSON.stringify({ club: club || null }) : void 0,
    updatedAt: nowISO()
  }).where(and(eq(students.id, studentId), eq(students.schoolId, session.schoolId))).run();
  if (parentEmail) {
    let parentUser = await db.select().from(users).where(eq(users.email, parentEmail)).get();
    let parentUserId = parentUser?.id;
    if (!parentUser) {
      parentUserId = generateId();
      const pwdHash = await hashPassword("Parent@123");
      await db.insert(users).values({
        id: parentUserId,
        email: parentEmail,
        displayName: parentName || "Parent",
        phone: parentPhone || null,
        passwordHash: pwdHash,
        role: "PARENT",
        forcePasswordChange: 1,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }).run();
    }
    const existingLink = await db.select().from(studentLinks).where(and(eq(studentLinks.studentId, studentId), eq(studentLinks.userId, parentUserId))).get();
    if (!existingLink) {
      await db.insert(studentLinks).values({
        id: generateId(),
        schoolId: session.schoolId,
        studentId,
        userId: parentUserId,
        linkType: "PARENT",
        createdAt: nowISO()
      }).run();
    }
  }
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleUpdateStudent, "handleUpdateStudent");
__name2(handleUpdateStudent, "handleUpdateStudent");
async function handleDeleteStudent(db, studentId, session, origin) {
  await db.delete(students).where(and(eq(students.id, studentId), eq(students.schoolId, session.schoolId))).run();
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleDeleteStudent, "handleDeleteStudent");
__name2(handleDeleteStudent, "handleDeleteStudent");
async function handleGetTeachers(db, session, origin) {
  const profiles = await db.select().from(teacherProfiles).where(eq(teacherProfiles.schoolId, session.schoolId)).all();
  const assignments = await db.select().from(teacherClassAssignments).where(eq(teacherClassAssignments.schoolId, session.schoolId)).all();
  const userIds = profiles.map((p) => p.userId);
  let usersList = [];
  if (userIds.length > 0) {
    usersList = await db.select({
      id: users.id,
      email: users.email,
      status: users.status
    }).from(users).where(inArray(users.id, userIds)).all();
  }
  const teachers = profiles.map((p) => {
    const user = usersList.find((u) => u.id === p.userId);
    const assignedClasses = assignments.filter((a) => a.teacherUserId === p.userId).map((a) => a.className);
    return {
      id: p.userId,
      displayName: p.displayName,
      email: user?.email,
      status: user?.status,
      classes: assignedClasses
    };
  });
  return jsonResponse({ teachers }, 200, origin);
}
__name(handleGetTeachers, "handleGetTeachers");
__name2(handleGetTeachers, "handleGetTeachers");
async function handleCreateTeacher(db, request, session, origin, env) {
  const body = await request.json();
  const { email, name, password, classes } = body;
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existing) return errorResponse("Email already in use", 400, origin);
  const userId = generateId();
  const pwdHash = await hashPassword(password);
  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash: pwdHash,
    role: "TEACHER",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    status: "ACTIVE",
    schoolId: session.schoolId
  }).run();
  await db.insert(teacherProfiles).values({
    id: generateId(),
    userId,
    schoolId: session.schoolId,
    displayName: name,
    createdAt: nowISO(),
    updatedAt: nowISO()
  }).run();
  if (Array.isArray(classes)) {
    for (const c of classes) {
      await db.insert(teacherClassAssignments).values({
        id: generateId(),
        schoolId: session.schoolId,
        teacherUserId: userId,
        className: c,
        createdAt: nowISO()
      }).run();
    }
  }
  try {
    const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
    const mailer = new EmailService(env);
    const loginUrl = `https://${school.subdomain}.${env.NEXT_PUBLIC_MAIN_DOMAIN || "reportsheet.com.ng"}/login`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: `Staff Invitation - ${school.name}`,
      html: EmailService.getStaffInviteTemplate(school.name, name, email.toLowerCase(), password, loginUrl)
    });
  } catch (err) {
    console.error("Staff invite email failed:", err);
  }
  return jsonResponse({ success: true, id: userId }, 201, origin);
}
__name(handleCreateTeacher, "handleCreateTeacher");
__name2(handleCreateTeacher, "handleCreateTeacher");
async function handleDeleteTeacher(db, teacherId, session, origin) {
  const profile = await db.select().from(teacherProfiles).where(and(eq(teacherProfiles.userId, teacherId), eq(teacherProfiles.schoolId, session.schoolId))).get();
  if (profile) {
    await db.delete(users).where(eq(users.id, teacherId)).run();
  }
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleDeleteTeacher, "handleDeleteTeacher");
__name2(handleDeleteTeacher, "handleDeleteTeacher");
async function handleGetParents(db, session, origin) {
  const users2 = await db.select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    phone: users.phone,
    status: users.status
  }).from(users).where(and(eq(users.schoolId, session.schoolId), eq(users.role, "PARENT"))).all();
  const links = await db.select().from(studentLinks).where(eq(studentLinks.schoolId, session.schoolId)).all();
  const allStudents = await db.select().from(students).where(eq(students.schoolId, session.schoolId)).all();
  const parents = users2.map((u) => {
    const parentLinks = links.filter((l) => l.userId === u.id);
    const linkedStudents = parentLinks.map((l) => {
      const s = allStudents.find((st) => st.id === l.studentId);
      return s ? { id: s.id, name: s.name, cls: s.className, linkId: l.id } : null;
    }).filter(Boolean);
    return {
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      phone: u.phone,
      status: u.status,
      linkedStudents
    };
  });
  return jsonResponse({ parents }, 200, origin);
}
__name(handleGetParents, "handleGetParents");
__name2(handleGetParents, "handleGetParents");
async function handleCreateParent(db, request, session, origin, env) {
  const body = await request.json();
  const { email, name, password, phone, studentId } = body;
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existing) return errorResponse("Email already in use", 400, origin);
  const userId = generateId();
  const pwdHash = await hashPassword(password);
  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    displayName: name,
    passwordHash: pwdHash,
    role: "PARENT",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    status: "ACTIVE",
    phone,
    schoolId: session.schoolId
  }).run();
  let studentName = "your child";
  if (studentId) {
    const student = await db.select().from(students).where(eq(students.id, studentId)).get();
    if (student) studentName = student.name;
    await db.insert(studentLinks).values({
      id: generateId(),
      schoolId: session.schoolId,
      studentId,
      userId,
      linkType: "PARENT",
      createdAt: nowISO()
    }).run();
  }
  try {
    const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
    const mailer = new EmailService(env);
    const loginUrl = `https://${school.subdomain}.${env.NEXT_PUBLIC_MAIN_DOMAIN || "reportsheet.com.ng"}/login`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: `Parent Portal Access - ${school.name}`,
      html: EmailService.getParentInviteTemplate(school.name, name, studentName, email.toLowerCase(), password, loginUrl)
    });
  } catch (err) {
    console.error("Parent invite email failed:", err);
  }
  return jsonResponse({ success: true, id: userId }, 201, origin);
}
__name(handleCreateParent, "handleCreateParent");
__name2(handleCreateParent, "handleCreateParent");
async function handleDeleteParent(db, userId, session, origin) {
  const user = await db.select().from(users).where(and(eq(users.id, userId), eq(users.schoolId, session.schoolId), eq(users.role, "PARENT"))).get();
  if (!user) return errorResponse("Parent not found", 404, origin);
  await db.delete(users).where(eq(users.id, userId)).run();
  await db.delete(studentLinks).where(eq(studentLinks.userId, userId)).run();
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleDeleteParent, "handleDeleteParent");
__name2(handleDeleteParent, "handleDeleteParent");
async function handleCreateStudentLink(db, request, session, origin) {
  const body = await request.json();
  const { userId, studentId, linkType } = body;
  await db.insert(studentLinks).values({
    id: generateId(),
    schoolId: session.schoolId,
    studentId,
    userId,
    linkType: linkType || "PARENT",
    createdAt: nowISO()
  }).run();
  return jsonResponse({ success: true }, 201, origin);
}
__name(handleCreateStudentLink, "handleCreateStudentLink");
__name2(handleCreateStudentLink, "handleCreateStudentLink");
async function handleCreateStudentUser(db, request, session, origin, env) {
  const body = await request.json();
  const { studentId, email, password } = body;
  if (!studentId || !email || !password) return errorResponse("studentId, email and password required", 400, origin);
  const student = await db.select().from(students).where(and(eq(students.id, studentId), eq(students.schoolId, session.schoolId))).get();
  if (!student) return errorResponse("Student not found", 404, origin);
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existing) return errorResponse("Email already in use", 400, origin);
  const userId = generateId();
  const pwdHash = await hashPassword(password);
  const now = nowISO();
  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    displayName: student.name,
    passwordHash: pwdHash,
    role: "STUDENT",
    status: "ACTIVE",
    schoolId: session.schoolId,
    createdAt: now,
    updatedAt: now
  }).run();
  await db.insert(studentLinks).values({
    id: generateId(),
    schoolId: session.schoolId,
    studentId,
    userId,
    linkType: "STUDENT",
    createdAt: now
  }).run();
  try {
    const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
    const mailer = new EmailService(env);
    const loginUrl = `https://${school.subdomain}.${env.NEXT_PUBLIC_MAIN_DOMAIN || "reportsheet.com.ng"}/login`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: `Student Portal Activated - ${school.name}`,
      html: EmailService.getStudentInviteTemplate(school.name, student.name, email.toLowerCase(), password, loginUrl)
    });
  } catch (err) {
    console.error("Student invite email failed:", err);
  }
  return jsonResponse({ success: true, userId }, 201, origin);
}
__name(handleCreateStudentUser, "handleCreateStudentUser");
__name2(handleCreateStudentUser, "handleCreateStudentUser");
async function handleDeleteStudentLink(db, linkId, session, origin) {
  await db.delete(studentLinks).where(and(eq(studentLinks.id, linkId), eq(studentLinks.schoolId, session.schoolId))).run();
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleDeleteStudentLink, "handleDeleteStudentLink");
__name2(handleDeleteStudentLink, "handleDeleteStudentLink");
async function handleGetScoresAdmin(db, request, session, origin) {
  const url = new URL(request.url);
  const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  const qSession = url.searchParams.get("session") || school?.session || "";
  const qTerm = url.searchParams.get("term") || school?.term || "";
  const rows = await db.select().from(scoreSheets).where(and(
    eq(scoreSheets.schoolId, session.schoolId),
    eq(scoreSheets.session, qSession),
    eq(scoreSheets.term, qTerm)
  )).all();
  const extrasRows = await db.select().from(reportExtras).where(and(
    eq(reportExtras.schoolId, session.schoolId),
    eq(reportExtras.session, qSession),
    eq(reportExtras.term, qTerm)
  )).all();
  const scores = {};
  const attendanceRows = await db.select({
    studentId: attendanceMarks.studentId,
    mark: attendanceMarks.mark
  }).from(attendanceMarks).innerJoin(attendanceSessions, eq(attendanceMarks.attendanceSessionId, attendanceSessions.id)).where(and(
    eq(attendanceSessions.schoolId, session.schoolId),
    eq(attendanceSessions.session, qSession),
    eq(attendanceSessions.term, qTerm),
    eq(attendanceSessions.status, "SUBMITTED")
  )).all();
  const attendanceStats = {};
  attendanceRows.forEach((r) => {
    if (!attendanceStats[r.studentId]) attendanceStats[r.studentId] = { present: 0, absent: 0, late: 0 };
    if (r.mark === "PRESENT") attendanceStats[r.studentId].present++;
    if (r.mark === "ABSENT") attendanceStats[r.studentId].absent++;
    if (r.mark === "LATE") attendanceStats[r.studentId].late++;
  });
  const reportExtras2 = {};
  rows.forEach((r) => {
    try {
      scores[r.studentId] = JSON.parse(r.data);
    } catch (e) {
      scores[r.studentId] = {};
    }
  });
  extrasRows.forEach((r) => {
    try {
      reportExtras2[r.studentId] = {
        ...r,
        traits: JSON.parse(r.traits),
        comments: JSON.parse(r.comments)
      };
    } catch (e) {
      reportExtras2[r.studentId] = r;
    }
  });
  Object.keys(attendanceStats).forEach((studentId) => {
    const stats = attendanceStats[studentId];
    const total = stats.present + stats.absent + stats.late;
    const attended = stats.present + stats.late;
    if (total > 0) {
      const percentage = Math.round(attended / total * 100);
      const autoAttendance = `${percentage}% (${attended}/${total})`;
      if (reportExtras2[studentId]) {
        reportExtras2[studentId].attendance = autoAttendance;
      } else {
        reportExtras2[studentId] = { attendance: autoAttendance, traits: {}, comments: {} };
      }
    }
  });
  return jsonResponse({ scores, reportExtras: reportExtras2 }, 200, origin);
}
__name(handleGetScoresAdmin, "handleGetScoresAdmin");
__name2(handleGetScoresAdmin, "handleGetScoresAdmin");
async function handleUpdateScoreAdmin(db, request, studentId, session, origin) {
  const body = await request.json();
  const { session: reqSession, term: reqTerm, ...scoreData } = body;
  const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  const qSession = reqSession || school?.session || "";
  const qTerm = reqTerm || school?.term || "";
  const existing = await db.select().from(scoreSheets).where(and(
    eq(scoreSheets.studentId, studentId),
    eq(scoreSheets.schoolId, session.schoolId),
    eq(scoreSheets.session, qSession),
    eq(scoreSheets.term, qTerm)
  )).get();
  if (existing) {
    await db.update(scoreSheets).set({ data: JSON.stringify(scoreData), updatedAt: nowISO() }).where(eq(scoreSheets.id, existing.id)).run();
  } else {
    await db.insert(scoreSheets).values({
      id: generateId(),
      schoolId: session.schoolId,
      studentId,
      session: qSession,
      term: qTerm,
      data: JSON.stringify(scoreData),
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
  }
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleUpdateScoreAdmin, "handleUpdateScoreAdmin");
__name2(handleUpdateScoreAdmin, "handleUpdateScoreAdmin");
async function handleGetReportExtras(db, studentId, session, origin) {
  const extras = await db.select().from(reportExtras).where(and(eq(reportExtras.studentId, studentId), eq(reportExtras.schoolId, session.schoolId))).get();
  if (!extras) return jsonResponse({ extras: null }, 200, origin);
  const e = { ...extras };
  try {
    e.traits = JSON.parse(e.traits);
  } catch (err) {
    e.traits = {};
  }
  try {
    e.comments = JSON.parse(e.comments);
  } catch (err) {
    e.comments = {};
  }
  return jsonResponse({ extras: e }, 200, origin);
}
__name(handleGetReportExtras, "handleGetReportExtras");
__name2(handleGetReportExtras, "handleGetReportExtras");
async function handleUpdateReportExtras(db, request, studentId, session, origin) {
  const body = await request.json();
  const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  const existing = await db.select().from(reportExtras).where(and(eq(reportExtras.studentId, studentId), eq(reportExtras.schoolId, session.schoolId))).get();
  const data = {
    attendance: body.attendance || "0",
    traits: JSON.stringify(body.traits || {}),
    comments: JSON.stringify(body.comments || {}),
    promotion: body.promotion || "",
    updatedAt: nowISO()
  };
  if (existing) {
    await db.update(reportExtras).set(data).where(eq(reportExtras.id, existing.id)).run();
  } else {
    await db.insert(reportExtras).values({
      id: generateId(),
      schoolId: session.schoolId,
      studentId,
      session: school?.session || "",
      term: school?.term || "",
      ...data,
      createdAt: nowISO()
    }).run();
  }
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleUpdateReportExtras, "handleUpdateReportExtras");
__name2(handleUpdateReportExtras, "handleUpdateReportExtras");
async function handlePortalMe(db, session, origin) {
  const user = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    displayName: users.displayName
  }).from(users).where(eq(users.id, session.userId)).get();
  if (!user) return errorResponse("User not found", 404, origin);
  const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  const links = await db.select({
    studentId: studentLinks.studentId
  }).from(studentLinks).where(eq(studentLinks.userId, session.userId)).all();
  const studentIds = links.map((l) => l.studentId);
  let students2 = [];
  if (studentIds.length > 0) {
    const placeholders = studentIds.map(() => "?").join(",");
    students2 = await db.select({
      id: students.id,
      name: students.name,
      admNo: students.admissionNo,
      cls: students.className
    }).from(students).where(sql`id IN (${sql.raw(placeholders)})`, ...studentIds).all();
  }
  return jsonResponse({ user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName, schoolId: school?.id }, school, students: students2 }, 200, origin);
}
__name(handlePortalMe, "handlePortalMe");
__name2(handlePortalMe, "handlePortalMe");
async function handlePortalStudent(db, studentId, session, origin) {
  if (!studentId) return errorResponse("studentId required", 400, origin);
  const student = await db.select().from(students).where(eq(students.id, studentId)).get();
  if (!student) return errorResponse("Student not found", 404, origin);
  return jsonResponse({ student }, 200, origin);
}
__name(handlePortalStudent, "handlePortalStudent");
__name2(handlePortalStudent, "handlePortalStudent");
async function handleAdminAttendance(db, request, session, origin) {
  const url = new URL(request.url);
  const dateStr = url.searchParams.get("date") || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  try {
    const marksForDate = await db.select({
      className: attendanceSessions.className,
      mark: attendanceMarks.mark
    }).from(attendanceMarks).innerJoin(attendanceSessions, eq(attendanceMarks.attendanceSessionId, attendanceSessions.id)).where(and(
      eq(attendanceSessions.schoolId, session.schoolId),
      eq(attendanceSessions.sessionDate, dateStr)
    )).all();
    const totalStudentsRes = await db.select({ id: students.id, className: students.className }).from(students).where(eq(students.schoolId, session.schoolId)).all();
    const totalStudents = totalStudentsRes.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    const totalMarked = marksForDate.length;
    if (totalMarked > 0) {
      marksForDate.forEach((m) => {
        if (m.mark === "PRESENT") present++;
        else if (m.mark === "ABSENT") absent++;
        else if (m.mark === "LATE") late++;
      });
    }
    const stats = {
      present: totalMarked > 0 ? Math.round(present / totalMarked * 100) : 100,
      absent: totalMarked > 0 ? Math.round(absent / totalMarked * 100) : 0,
      late: totalMarked > 0 ? Math.round(late / totalMarked * 100) : 0,
      total: totalStudents
    };
    const classBreakdownMap = {};
    totalStudentsRes.forEach((student) => {
      const clsName = student.className || "Unassigned";
      if (!classBreakdownMap[clsName]) {
        classBreakdownMap[clsName] = { name: clsName, present: 0, absent: 0, late: 0, total: 0 };
      }
      classBreakdownMap[clsName].total++;
    });
    marksForDate.forEach((m) => {
      const clsName = m.className || "Unassigned";
      if (!classBreakdownMap[clsName]) {
        classBreakdownMap[clsName] = { name: clsName, present: 0, absent: 0, late: 0, total: 0 };
      }
      if (m.mark === "PRESENT") classBreakdownMap[clsName].present++;
      else if (m.mark === "ABSENT") classBreakdownMap[clsName].absent++;
      else if (m.mark === "LATE") classBreakdownMap[clsName].late++;
    });
    const classBreakdown = Object.values(classBreakdownMap).map((cls) => {
      const totalMarkedInClass = cls.present + cls.absent + cls.late;
      return {
        name: cls.name,
        p: totalMarkedInClass > 0 ? Math.round(cls.present / totalMarkedInClass * 100) : 100,
        a: totalMarkedInClass > 0 ? Math.round(cls.absent / totalMarkedInClass * 100) : 0,
        l: totalMarkedInClass > 0 ? Math.round(cls.late / totalMarkedInClass * 100) : 0
      };
    });
    return jsonResponse({ stats, classBreakdown }, 200, origin);
  } catch (err) {
    console.error("Admin Attendance Fetch Error:", err);
    return errorResponse(`Failed to calculate attendance: ${err.message}`, 500, origin);
  }
}
__name(handleAdminAttendance, "handleAdminAttendance");
__name2(handleAdminAttendance, "handleAdminAttendance");
async function handlePortalAttendanceSummary(db, request, session, origin) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!studentId || !from || !to) return errorResponse("studentId, from, and to required", 400, origin);
  const marks = await db.select({
    mark: attendanceMarks.mark
  }).from(attendanceMarks).innerJoin(
    attendanceSessions,
    eq(attendanceMarks.attendanceSessionId, attendanceSessions.id)
  ).where(
    and(
      eq(attendanceMarks.studentId, studentId),
      gte(attendanceSessions.sessionDate, from),
      lte(attendanceSessions.sessionDate, to)
    )
  ).all();
  const present = marks.filter((m) => m.mark === "PRESENT").length;
  const absent = marks.filter((m) => m.mark === "ABSENT").length;
  const late = marks.filter((m) => m.mark === "LATE").length;
  const total = marks.length;
  const presentRate = total > 0 ? (present + late) / total : 0;
  return jsonResponse({
    summary: { present, absent, late, total, presentRate }
  }, 200, origin);
}
__name(handlePortalAttendanceSummary, "handlePortalAttendanceSummary");
__name2(handlePortalAttendanceSummary, "handlePortalAttendanceSummary");
async function handlePortalAttendanceDays(db, request, session, origin) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!studentId || !from || !to) return errorResponse("studentId, from, and to required", 400, origin);
  const days = await db.select({
    date: attendanceSessions.sessionDate,
    mark: attendanceMarks.mark,
    note: attendanceMarks.note
  }).from(attendanceMarks).innerJoin(
    attendanceSessions,
    eq(attendanceMarks.attendanceSessionId, attendanceSessions.id)
  ).where(
    and(
      eq(attendanceMarks.studentId, studentId),
      gte(attendanceSessions.sessionDate, from),
      lte(attendanceSessions.sessionDate, to)
    )
  ).orderBy(desc(attendanceSessions.sessionDate)).all();
  return jsonResponse({ days }, 200, origin);
}
__name(handlePortalAttendanceDays, "handlePortalAttendanceDays");
__name2(handlePortalAttendanceDays, "handlePortalAttendanceDays");
async function handlePortalScores(db, studentId, session, origin) {
  const row = await db.select().from(scoreSheets).where(and(eq(scoreSheets.studentId, studentId), eq(scoreSheets.schoolId, session.schoolId))).get();
  const scores = {};
  if (row) {
    try {
      scores[studentId] = JSON.parse(row.data);
    } catch (e) {
      scores[studentId] = {};
    }
  }
  return jsonResponse({ scores }, 200, origin);
}
__name(handlePortalScores, "handlePortalScores");
__name2(handlePortalScores, "handlePortalScores");
async function handleGetExams(db, session, origin) {
  const allExams = await db.select().from(exams).where(eq(exams.schoolId, session.schoolId)).orderBy(desc(exams.createdAt)).all();
  return jsonResponse({ exams: allExams.map((e) => ({
    id: e.id,
    subject: e.subject,
    class_level: e.classLevel,
    term: e.term,
    session: e.session,
    exam_type: e.examType,
    question_type: e.questionType,
    source_mode: e.sourceMode,
    duration: e.duration,
    file_url: e.fileUrl,
    is_shared: e.isShared,
    created_at: e.createdAt
  })) }, 200, origin);
}
__name(handleGetExams, "handleGetExams");
__name2(handleGetExams, "handleGetExams");
async function handleGenerateExam(db, request, session, env, origin) {
  const body = await request.json();
  const { subject, classLevel, topic, questionCount, term, session: schoolSession, examType, questionType, sourceMode, documentText, sourceUrl, duration, isShared } = body;
  if (!subject || !classLevel) return errorResponse("Missing required fields: subject and classLevel", 400, origin);
  if (!env.AI) return errorResponse("AI binding not found", 500, origin);
  let contextText = topic || "";
  if (sourceMode === "url" && sourceUrl) {
    try {
      const urlRes = await fetch(sourceUrl, {
        headers: { "User-Agent": "EduReport-ExamMaker/1.0" },
        signal: AbortSignal.timeout(1e4)
      });
      let html = await urlRes.text();
      html = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      contextText = html.substring(0, 8e3);
    } catch (urlErr) {
      return errorResponse("Failed to fetch URL: " + urlErr.message, 400, origin);
    }
  } else if (sourceMode === "document" && documentText) {
    contextText = documentText.substring(0, 8e3);
  }
  if (!contextText) return errorResponse("No content provided. Enter a topic, paste text, upload a document, or provide a URL.", 400, origin);
  const count = questionCount || 20;
  const qType = questionType || "mcq";
  const termLabel = term || "2nd Term";
  const sessionLabel = schoolSession || (/* @__PURE__ */ new Date()).getFullYear() + "/" + ((/* @__PURE__ */ new Date()).getFullYear() + 1);
  const examTypeLabel = examType || "Terminal Exam";
  let formatInstructions = "";
  if (qType === "mcq") {
    formatInstructions = `Generate ${count} multiple choice questions. Each question must have exactly 4 options (A, B, C, D). Use this JSON structure:
[
  {
    "question": "Question text here?",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation of the correct answer."
  }
]`;
  } else if (qType === "theory") {
    formatInstructions = `Generate ${count} theory/essay questions suitable for written examination. Use this JSON structure:
[
  {
    "question": "Question text here?",
    "type": "theory",
    "options": [],
    "correctAnswer": -1,
    "explanation": "Key points expected in the answer."
  }
]`;
  } else {
    const mcqCount = Math.round(count * 0.6);
    const theoryCount = count - mcqCount;
    formatInstructions = `Generate ${mcqCount} multiple choice questions followed by ${theoryCount} theory/essay questions. Use this JSON structure:
[
  {
    "question": "MCQ question here?",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation."
  },
  {
    "question": "Theory question here?",
    "type": "theory",
    "options": [],
    "correctAnswer": -1,
    "explanation": "Key points expected."
  }
]`;
  }
  const prompt = `You are an expert Nigerian secondary school examiner creating a ${examTypeLabel} for ${termLabel} (${sessionLabel} academic session).

Subject: ${subject}
Class Level: ${classLevel}
Exam Content/Context:
---
${contextText}
---

${formatInstructions}

IMPORTANT RULES:
1. Questions must be relevant to Nigerian secondary school curriculum
2. Use clear, unambiguous language appropriate for ${classLevel} students
3. Output ONLY valid JSON array with no markdown, no extra text, no comments
4. Questions should test understanding, not just memorisation
5. Make questions progressively harder (easy, medium, hard)
`;
  try {
    const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096
    });
    let questions;
    if (typeof aiResponse.response === "object" && aiResponse.response !== null) {
      questions = aiResponse.response;
    } else {
      let jsonStr = typeof aiResponse.response === "string" ? aiResponse.response : aiResponse.response || "";
      const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
      }
      questions = JSON.parse(jsonStr);
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("AI returned invalid question format");
    }
    const id = `exam-${generateId()}`;
    await db.insert(exams).values({
      id,
      schoolId: session.schoolId,
      subject,
      classLevel,
      topic: contextText.substring(0, 500),
      questions: JSON.stringify(questions),
      term: termLabel,
      session: sessionLabel,
      examType: examTypeLabel,
      questionType: qType,
      sourceMode: sourceMode || "topic",
      duration: duration || "1 Hour",
      isShared: isShared ? 1 : 0,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
    if (isShared) {
      await saveExamToR2(env, { id, subject, classLevel, questions, term: termLabel, session: sessionLabel, examType: examTypeLabel, questionType: qType, duration: duration || "1 Hour" });
    }
    return jsonResponse({ id, questions, term: termLabel, session: sessionLabel, examType: examTypeLabel, questionType: qType, duration: duration || "1 Hour", is_shared: isShared ? 1 : 0 }, 201, origin);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return errorResponse("Failed to generate exam from AI: " + error.message, 500, origin);
  }
}
__name(handleGenerateExam, "handleGenerateExam");
__name2(handleGenerateExam, "handleGenerateExam");
async function handleGetExamDetail(db, examId, session, origin) {
  const exam = await db.select().from(exams).where(eq(exams.id, examId)).get();
  if (!exam) return errorResponse("Exam not found", 404, origin);
  if (exam.isShared !== 1 && exam.schoolId !== session.schoolId) {
    return errorResponse("Unauthorized access to exam", 403, origin);
  }
  return jsonResponse({ exam: {
    id: exam.id,
    school_id: exam.schoolId,
    subject: exam.subject,
    class_level: exam.classLevel,
    questions: JSON.parse(exam.questions),
    created_at: exam.createdAt,
    topic: exam.topic,
    term: exam.term,
    session: exam.session,
    exam_type: exam.examType,
    question_type: exam.questionType,
    source_mode: exam.sourceMode,
    duration: exam.duration,
    is_shared: exam.isShared
  } }, 200, origin);
}
__name(handleGetExamDetail, "handleGetExamDetail");
__name2(handleGetExamDetail, "handleGetExamDetail");
async function handleUpdateExam(db, request, examId, session, env, origin) {
  const { subject, classLevel, topic, questions, term, session: schoolSession, examType, questionType, duration, isShared } = await request.json();
  const existing = await db.select().from(exams).where(and(eq(exams.id, examId), eq(exams.schoolId, session.schoolId))).get();
  if (!existing) return errorResponse("Exam not found", 404, origin);
  await db.update(exams).set({
    subject: subject || existing.subject,
    classLevel: classLevel || existing.classLevel,
    topic: topic !== void 0 ? topic : existing.topic,
    questions: questions ? JSON.stringify(questions) : existing.questions,
    term: term !== void 0 ? term : existing.term,
    session: schoolSession !== void 0 ? schoolSession : existing.session,
    examType: examType !== void 0 ? examType : existing.examType,
    questionType: questionType !== void 0 ? questionType : existing.questionType,
    duration: duration !== void 0 ? duration : existing.duration,
    isShared: isShared !== void 0 ? isShared ? 1 : 0 : existing.isShared,
    updatedAt: nowISO()
  }).where(eq(exams.id, examId)).run();
  const finalIsShared = isShared !== void 0 ? isShared ? 1 : 0 : existing.isShared;
  if (finalIsShared === 1) {
    await saveExamToR2(env, {
      id: examId,
      subject: subject || existing.subject,
      classLevel: classLevel || existing.classLevel,
      questions: questions || JSON.parse(existing.questions),
      term: term !== void 0 ? term : existing.term,
      session: schoolSession !== void 0 ? schoolSession : existing.session,
      examType: examType !== void 0 ? examType : existing.examType,
      duration: duration !== void 0 ? duration : existing.duration
    });
  }
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleUpdateExam, "handleUpdateExam");
__name2(handleUpdateExam, "handleUpdateExam");
async function handleDeleteExam(db, examId, session, origin) {
  const existing = await db.select().from(exams).where(and(eq(exams.id, examId), eq(exams.schoolId, session.schoolId))).get();
  if (!existing) return errorResponse("Exam not found", 404, origin);
  await db.delete(exams).where(eq(exams.id, examId)).run();
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleDeleteExam, "handleDeleteExam");
__name2(handleDeleteExam, "handleDeleteExam");
async function handleGenerateAiRemarks(db, request, session, env, origin) {
  const { studentId, type } = await request.json();
  if (!studentId) return errorResponse("studentId required", 400, origin);
  if (!env.AI) return errorResponse("AI binding not found", 500, origin);
  const student = await db.select().from(students).where(eq(students.id, studentId)).get();
  if (!student) return errorResponse("Student not found", 404, origin);
  const scoresRow = await db.select().from(scoreSheets).where(eq(scoreSheets.studentId, studentId)).get();
  const scores = scoresRow ? JSON.parse(scoresRow.data) : {};
  const subjects = Object.keys(scores);
  const scoreDetails = subjects.map((sub) => {
    const s = scores[sub] || { ca1: 0, ca2: 0, exam: 0 };
    const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
    return `${sub}: ${total}%`;
  }).join(", ");
  const prompt = `Write a short, professional end-of-term report card remark for a student named ${student.name}.
The context is from the perspective of a ${type === "teacher" ? "Form Teacher" : "Principal"}.
Here are their scores for the term: ${scoreDetails || "No scores recorded yet"}.
Keep it to 2-3 sentences max. Be encouraging but honest based on the scores.`;
  try {
    const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [{ role: "user", content: prompt }]
    });
    return jsonResponse({ remark: aiResponse.response?.trim() || "Remark generated successfully." }, 200, origin);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return errorResponse("Failed to generate remark: " + error.message, 500, origin);
  }
}
__name(handleGenerateAiRemarks, "handleGenerateAiRemarks");
__name2(handleGenerateAiRemarks, "handleGenerateAiRemarks");
async function handleCreateCustomExam(db, request, session, origin) {
  try {
    const { subject, classLevel, topic, questions, term, session: schoolSession, examType, questionType, duration, isShared } = await request.json();
    if (!subject || !classLevel) return errorResponse("Subject and classLevel required", 400, origin);
    const id = `exam-${generateId()}`;
    await db.insert(exams).values({
      id,
      schoolId: session.schoolId,
      subject,
      classLevel,
      topic: topic || "",
      questions: JSON.stringify(questions || []),
      term: term || "2nd Term",
      session: schoolSession || (/* @__PURE__ */ new Date()).getFullYear() + "/" + ((/* @__PURE__ */ new Date()).getFullYear() + 1),
      examType: examType || "Terminal Exam",
      questionType: questionType || "mcq",
      sourceMode: "topic",
      duration: duration || "1 Hour",
      isShared: isShared ? 1 : 0,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
    return jsonResponse({ id, success: true }, 201, origin);
  } catch (error) {
    return errorResponse("Failed to create custom exam: " + error.message, 500, origin);
  }
}
__name(handleCreateCustomExam, "handleCreateCustomExam");
__name2(handleCreateCustomExam, "handleCreateCustomExam");
async function saveExamToR2(env, exam) {
  if (!env.BUCKET) return;
  try {
    const level = exam.classLevel.startsWith("JSS") || exam.classLevel.startsWith("SS") ? "Secondary" : "Primary";
    const subLevel = exam.classLevel.startsWith("JSS") ? "JSS" : exam.classLevel.startsWith("SS") ? "SS" : "";
    const classFolder = `${exam.classLevel.replace(/\s+/g, "")}EXAM`;
    const path = `Exam Questions/${level}/${subLevel}/${exam.term}/${classFolder}/${exam.subject}.json`;
    await env.BUCKET.put(path, JSON.stringify(exam, null, 2), {
      httpMetadata: { contentType: "application/json" }
    });
    console.log(`Saved exam to R2: ${path}`);
  } catch (err) {
    console.error(`Failed to save exam to R2:`, err);
  }
}
__name(saveExamToR2, "saveExamToR2");
__name2(saveExamToR2, "saveExamToR2");
async function handleGetSharedExams(db, origin) {
  try {
    const list = await db.select().from(exams).where(eq(exams.isShared, 1)).orderBy(desc(exams.createdAt)).all();
    return jsonResponse({ exams: list.map((e) => ({
      id: e.id,
      subject: e.subject,
      class_level: e.classLevel,
      term: e.term,
      session: e.session,
      exam_type: e.examType,
      question_type: e.questionType,
      source_mode: e.sourceMode,
      duration: e.duration,
      file_url: e.fileUrl,
      is_shared: e.isShared,
      created_at: e.createdAt
    })) }, 200, origin);
  } catch (error) {
    return errorResponse("Failed to fetch shared exams: " + error.message, 500, origin);
  }
}
__name(handleGetSharedExams, "handleGetSharedExams");
__name2(handleGetSharedExams, "handleGetSharedExams");
async function handleImportExam(db, request, session, env, origin) {
  const body = await request.json();
  const { subject, classLevel, term, session: schoolSession, examType, duration, textContent, fileUrl } = body;
  if (!subject || !classLevel || !textContent) {
    return errorResponse("Missing required fields: subject, classLevel, and textContent", 400, origin);
  }
  if (!env.AI) return errorResponse("AI binding not found", 500, origin);
  const prompt = `You are an expert exam parser. Convert the following raw exam paper text into a structured JSON array of questions.
Each question should be classified as either 'mcq' (multiple choice) or 'theory' (essay/written).
For 'mcq' questions, provide exactly 4 options and the 0-indexed correctAnswer.
For 'theory' questions, set options to an empty array and correctAnswer to -1.
 
Use this JSON structure:
[
  {
    "question": "Question text?",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of the answer."
  }
]
 
Exam Paper Text:
---
${textContent}
---
 
Output ONLY the raw JSON array with no markdown, no extra text, and no explanations outside of the JSON.`;
  try {
    const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096
    });
    let questions;
    if (typeof aiResponse.response === "object" && aiResponse.response !== null) {
      questions = aiResponse.response;
    } else {
      let jsonStr = typeof aiResponse.response === "string" ? aiResponse.response : aiResponse.response || "";
      const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
      }
      questions = JSON.parse(jsonStr);
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("AI returned invalid question format");
    }
    const id = `exam-${generateId()}`;
    await db.insert(exams).values({
      id,
      schoolId: session.schoolId,
      subject,
      classLevel,
      topic: "Imported Exam",
      questions: JSON.stringify(questions),
      term: term || "2nd Term",
      session: schoolSession || (/* @__PURE__ */ new Date()).getFullYear() + "/" + ((/* @__PURE__ */ new Date()).getFullYear() + 1),
      examType: examType || "Terminal Exam",
      questionType: questions.every((q) => q.type === "mcq") ? "mcq" : questions.every((q) => q.type === "theory") ? "theory" : "mixed",
      sourceMode: "document",
      duration: duration || "1 Hour",
      fileUrl: fileUrl || null,
      isShared: 1,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
    await saveExamToR2(env, {
      id,
      subject,
      classLevel,
      questions,
      term: term || "2nd Term",
      session: schoolSession || (/* @__PURE__ */ new Date()).getFullYear() + "/" + ((/* @__PURE__ */ new Date()).getFullYear() + 1),
      examType: examType || "Terminal Exam",
      duration: duration || "1 Hour"
    });
    return jsonResponse({ id, questions }, 201, origin);
  } catch (error) {
    console.error("AI Import Error:", error);
    return errorResponse("Failed to parse and import exam: " + error.message, 500, origin);
  }
}
__name(handleImportExam, "handleImportExam");
__name2(handleImportExam, "handleImportExam");
async function handleAdminSettings(db, origin) {
  const settings = await db.select().from(systemSettings).all();
  const map = {};
  settings.forEach((s) => {
    map[s.k] = s.v;
  });
  return jsonResponse({ settings: map }, 200, origin);
}
__name(handleAdminSettings, "handleAdminSettings");
__name2(handleAdminSettings, "handleAdminSettings");
async function handleSaveAdminSettings(db, request, origin) {
  const body = await request.json();
  for (const k of Object.keys(body)) {
    await db.insert(systemSettings).values({
      k,
      v: String(body[k]),
      updatedAt: nowISO()
    }).onConflictDoUpdate({
      target: systemSettings.k,
      set: { v: String(body[k]), updatedAt: nowISO() }
    }).run();
  }
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleSaveAdminSettings, "handleSaveAdminSettings");
__name2(handleSaveAdminSettings, "handleSaveAdminSettings");
async function handleAdminMaintenance(db, origin) {
  const row = await db.select().from(systemSettings).where(eq(systemSettings.k, "maintenance_mode")).get();
  const data = row ? JSON.parse(row.v) : { enabled: false, message: "", allowedIps: [] };
  return jsonResponse(data, 200, origin);
}
__name(handleAdminMaintenance, "handleAdminMaintenance");
__name2(handleAdminMaintenance, "handleAdminMaintenance");
async function handleSaveAdminMaintenance(db, request, origin) {
  const body = await request.json();
  await db.insert(systemSettings).values({
    k: "maintenance_mode",
    v: JSON.stringify(body),
    updatedAt: nowISO()
  }).onConflictDoUpdate({
    target: systemSettings.k,
    set: { v: JSON.stringify(body), updatedAt: nowISO() }
  }).run();
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleSaveAdminMaintenance, "handleSaveAdminMaintenance");
__name2(handleSaveAdminMaintenance, "handleSaveAdminMaintenance");
async function handleAdminUsers(db, origin) {
  const users2 = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    status: users.status,
    lastLoginAt: users.lastLoginAt,
    totpEnabled: users.totpEnabled
  }).from(users).limit(200).all();
  return jsonResponse({ users: users2 }, 200, origin);
}
__name(handleAdminUsers, "handleAdminUsers");
__name2(handleAdminUsers, "handleAdminUsers");
async function handleGetPublicConfig(db, origin) {
  const settings = await db.select().from(systemSettings).where(sql`k LIKE 'price_%' OR k LIKE 'support_%'`).all();
  const map = {};
  settings.forEach((s) => {
    map[s.k] = s.v;
  });
  return jsonResponse({
    pricing: {
      starter: map["price_starter"] || "15000",
      lifetime: map["price_lifetime"] || "25000",
      pro: map["price_pro"] || "35000"
    },
    support: {
      whatsapp: map["support_whatsapp"] || "08037000456",
      email: map["support_email"] || "abbeydmarketer@gmail.com"
    }
  }, 200, origin);
}
__name(handleGetPublicConfig, "handleGetPublicConfig");
__name2(handleGetPublicConfig, "handleGetPublicConfig");
async function handleGetPortalAnnouncements(db, role, origin) {
  const list = await db.select().from(announcements).where(
    and(
      eq(announcements.status, "ACTIVE"),
      sql`${announcements.targetRole} IN (${role}, 'ALL')`
    )
  ).orderBy(desc(announcements.createdAt)).limit(10).all();
  return jsonResponse({ announcements: list }, 200, origin);
}
__name(handleGetPortalAnnouncements, "handleGetPortalAnnouncements");
__name2(handleGetPortalAnnouncements, "handleGetPortalAnnouncements");
async function handleAdminAnnouncements(db, origin) {
  const list = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).all();
  return jsonResponse({ announcements: list }, 200, origin);
}
__name(handleAdminAnnouncements, "handleAdminAnnouncements");
__name2(handleAdminAnnouncements, "handleAdminAnnouncements");
async function handleCreateAnnouncement(db, request, session, origin) {
  const { title, content, targetRole, priority } = await request.json();
  if (!title || !content) return errorResponse("Title and content required", 400, origin);
  const id = generateId();
  const now = nowISO();
  await db.insert(announcements).values({
    id,
    authorUserId: session.userId,
    title,
    content,
    targetRole: targetRole || "SCHOOL",
    priority: priority || "NORMAL",
    createdAt: now,
    updatedAt: now
  }).run();
  return jsonResponse({ success: true, id }, 201, origin);
}
__name(handleCreateAnnouncement, "handleCreateAnnouncement");
__name2(handleCreateAnnouncement, "handleCreateAnnouncement");
async function handleDeleteAnnouncement(db, id, origin) {
  await db.delete(announcements).where(eq(announcements.id, id)).run();
  return jsonResponse({ success: true }, 200, origin);
}
__name(handleDeleteAnnouncement, "handleDeleteAnnouncement");
__name2(handleDeleteAnnouncement, "handleDeleteAnnouncement");
async function handleBulkImportStudents(db, request, session, origin) {
  const { students: students2 } = await request.json();
  if (!Array.isArray(students2) || students2.length === 0) return errorResponse("Invalid students array", 400, origin);
  const now = nowISO();
  const results = { success: 0, failed: 0, errors: [] };
  for (const s of students2) {
    try {
      const cls = s.cls || s.className;
      const admNo = s.admNo || s.admissionNo;
      if (!s.name || !cls) {
        results.failed++;
        results.errors.push(`Missing name or class for student: ${JSON.stringify(s)}`);
        continue;
      }
      await db.insert(students).values({
        id: generateId(),
        schoolId: session.schoolId,
        name: s.name,
        className: cls,
        admissionNo: admNo || `ADM-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
        gender: s.gender || null,
        createdAt: now,
        updatedAt: now
      }).run();
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Error inserting ${s.name}: ${err.message}`);
    }
  }
  return jsonResponse({ results }, 200, origin);
}
__name(handleBulkImportStudents, "handleBulkImportStudents");
__name2(handleBulkImportStudents, "handleBulkImportStudents");
async function handleAdminAICommand(db, request, session, env, origin) {
  const { command } = await request.json();
  if (!command) return errorResponse("Command required", 400, origin);
  if (!env.AI) return errorResponse("AI binding not found", 500, origin);
  const prompt = `You are a school management assistant for EduReport.
The user is a school admin and wants to perform an action or ask a question.
Current School ID: ${session.schoolId}

EduReport App Context:
- A school report-card and management system.
- Key features: Student Profiles & Management, Teacher Directory, Parent Portal, Scores & Broadsheet Entry (CA1, CA2, Exam scores), Report Card Generation (PDF exports), AI-assisted Report Card Remarks (Form Teacher & Principal remarks), and Billing/Subscription Plans (Basic, Premium, Elite).
- Side menu/navigation items: Dashboard, Students, Teachers, Parents, Scores, Reports, Billing, Settings.
- The AI Command Center (this chat) allows admins/teachers to run quick commands:
  * "Record X% in [Subject] for [Student]" (e.g. "Record 80% in English for Adamu")
  * "Search student [Name]" (e.g. "Search student Sarah")
  * "Generate comments for [Class]" (e.g. "Generate comments for JSS 1")
  * "Generate report for [Class]" (e.g. "Generate report for JSS 1")
  * Ask general questions about the app's features, setup, billing, and configurations.

Available Intents/Tools:
1. record_score(student_name, subject, score): Update a student's score.
2. search_student(query): Find students by name or admission number.
3. generate_report(class_name): Generate report cards for a class.
4. generate_comments(class_name): Automatically generate report card comments for both Teacher and Principal based on student grades.
5. general_qa(query): User is asking a question about the app, how to use it, its features, setup, pricing/billing, or general help. Provide a helpful, direct, and detailed answer in the "reply" field.

Analyze the user command: "${command}"

Output ONLY a JSON object with:
- "intent": the tool to use (record_score, search_student, generate_report, generate_comments, general_qa, or unknown)
- "params": an object with extracted parameters
- "reply": a friendly response acknowledging the intent (for tools) OR the direct, helpful answer to the user's question (for general_qa).

Examples:
1. "Generate comments for JSS 1" -> {"intent": "generate_comments", "params": {"class_name": "JSS 1"}, "reply": "I'll generate AI comments for JSS 1."}
2. "How do I add a new student?" -> {"intent": "general_qa", "params": {"query": "How do I add a new student?"}, "reply": "To add a new student, navigate to the **Students** page from the sidebar menu, click on the **Add Student** button, and fill in the details. You can also perform a bulk student import if you have many students."}
`;
  try {
    let result = null;
    try {
      const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      });
      if (typeof aiResponse.response === "object" && aiResponse.response !== null) {
        result = aiResponse.response;
      } else {
        let jsonStr = typeof aiResponse.response === "string" ? aiResponse.response : aiResponse.response || "";
        if (jsonStr.includes("```json")) {
          jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
        } else if (jsonStr.includes("```")) {
          jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
        } else {
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) jsonStr = jsonMatch[0];
        }
        result = JSON.parse(jsonStr);
      }
      if (!result || !result.intent || result.intent === "unknown") {
        throw new Error("Invalid AI intent parsing");
      }
    } catch (aiErr) {
      console.error("AI execution failed, using fallback parser:", aiErr);
      const lower = command.toLowerCase();
      if (lower.includes("score") || lower.includes("record") || lower.includes("%")) {
        const scoreMatch = lower.match(/(\d+)%/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
        let student_name = "Adamu";
        let subject = "English";
        const subjects = ["math", "english", "science", "biology", "chemistry", "physics", "history", "geography"];
        for (const sub of subjects) {
          if (lower.includes(sub)) {
            subject = sub.charAt(0).toUpperCase() + sub.slice(1);
            break;
          }
        }
        const parts = command.split(/\s+/);
        const forIndices = parts.map((p, i) => p.toLowerCase() === "for" ? i : -1).filter((i) => i !== -1);
        if (forIndices.length > 0) {
          const lastForIndex = forIndices[forIndices.length - 1];
          if (lastForIndex < parts.length - 1) {
            student_name = parts.slice(lastForIndex + 1).join(" ").replace(/[.%?]/g, "").trim();
          }
        }
        result = {
          intent: "record_score",
          params: { student_name, subject, score },
          reply: `I'll record a score of ${score}% for ${subject} for student ${student_name}.`
        };
      } else if (lower.includes("search") || lower.includes("find") || lower.includes("student")) {
        let query = command.replace(/(search|find|student|students|for)/gi, "").trim();
        result = {
          intent: "search_student",
          params: { query },
          reply: `Searching for student matching "${query}"...`
        };
      } else if (lower.includes("comment") || lower.includes("comments") || lower.includes("opinion") || lower.includes("remark")) {
        let class_name = "JSS 1A";
        const classMatch = command.match(/(jss\s*\d+\w*|sss\s*\d+\w*)/i);
        if (classMatch) {
          class_name = classMatch[0].toUpperCase();
        }
        result = {
          intent: "generate_comments",
          params: { class_name },
          reply: `Generating AI comments for ${class_name}...`
        };
      } else if (lower.includes("report") || lower.includes("generate") || lower.includes("card")) {
        let class_name = "JSS 1A";
        const classMatch = command.match(/(jss\s*\d+\w*|sss\s*\d+\w*)/i);
        if (classMatch) {
          class_name = classMatch[0].toUpperCase();
        }
        result = {
          intent: "generate_report",
          params: { class_name },
          reply: `Generating reports for ${class_name}...`
        };
      } else {
        result = {
          intent: "unknown",
          params: {},
          reply: "I couldn't understand that command. Try saying 'Record 55% in Mathematics for John', 'Generate comments for JSS 1', or 'Search student Adamu'."
        };
      }
    }
    if (result.intent === "record_score") {
      const { student_name, subject, score } = result.params;
      const student = await db.select().from(students).where(and(eq(students.schoolId, session.schoolId), like(students.name, `%${student_name}%`))).get();
      if (!student) {
        result.reply = `I couldn't find a student named "${student_name}".`;
      } else {
        const existing = await db.select().from(scoreSheets).where(and(eq(scoreSheets.studentId, student.id), eq(scoreSheets.schoolId, session.schoolId))).get();
        const scoreData = existing ? JSON.parse(existing.data) : {};
        scoreData[subject] = { ca1: 0, ca2: 0, exam: score };
        if (existing) {
          await db.update(scoreSheets).set({ data: JSON.stringify(scoreData), updatedAt: nowISO() }).where(eq(scoreSheets.id, existing.id)).run();
        } else {
          await db.insert(scoreSheets).values({
            id: generateId(),
            schoolId: session.schoolId,
            studentId: student.id,
            data: JSON.stringify(scoreData),
            createdAt: nowISO(),
            updatedAt: nowISO()
          }).run();
        }
        result.reply = `Successfully recorded ${score}% for ${subject} for ${student.name}.`;
      }
    } else if (result.intent === "search_student") {
      const { query } = result.params;
      const students2 = await db.select().from(students).where(and(eq(students.schoolId, session.schoolId), sql`name LIKE ${`%${query}%`} OR admission_no LIKE ${`%${query}%`}`)).limit(5).all();
      if (students2.length === 0) {
        result.reply = `No students found matching "${query}".`;
      } else {
        result.reply = `Found ${students2.length} students: ${students2.map((s) => `${s.name} (${s.className})`).join(", ")}.`;
      }
    } else if (result.intent === "generate_report") {
      result.reply = `I've queued the report generation for ${result.params.class_name}. You'll get a notification when they are ready.`;
    } else if (result.intent === "generate_comments") {
      const { class_name } = result.params;
      const classStudents = await db.select().from(students).where(and(eq(students.schoolId, session.schoolId), eq(students.className, class_name))).all();
      const scoresRows = await db.select().from(scoreSheets).where(eq(scoreSheets.schoolId, session.schoolId)).all();
      let successCount = 0;
      for (const student of classStudents) {
        const studentScoreSheet = scoresRows.find((s) => s.studentId === student.id);
        const subjectsData = studentScoreSheet ? JSON.parse(studentScoreSheet.data) : {};
        let total = 0;
        let count = 0;
        Object.keys(subjectsData).forEach((sub) => {
          const s = subjectsData[sub];
          total += (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
          count++;
        });
        const average = count > 0 ? total / count : 0;
        const aiPrompt = `Generate a termly report card evaluation for a student.
Student Name: ${student.name}
Class: ${class_name}
Average Academic Performance: ${average.toFixed(1)}%
Number of Subjects Offered: ${count}

Based on this, generate exactly two concise sentences:
1. Teacher's comment: An evaluation of their academic attitude, behavioral traits, and subject performance.
2. Principal's comment: A strategic summary comment advising on focus areas, promotions, or termly encouragement.

Output ONLY a raw JSON object with keys:
{
  "teacher": "Generated teacher comment",
  "principal": "Generated principal comment"
}`;
        let comments = {
          teacher: `${student.name} is showing average performance, but can do better with more focus.`,
          principal: "A fair result. Go through more practice assignments next term."
        };
        try {
          const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
            messages: [{ role: "user", content: aiPrompt }],
            max_tokens: 300
          });
          let jsonStr = aiResponse.response || "";
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            comments = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error("Failed to generate AI comments for student", student.name, e);
        }
        const existing = await db.select().from(reportExtras).where(and(eq(reportExtras.studentId, student.id), eq(reportExtras.schoolId, session.schoolId))).get();
        const data = {
          attendance: existing ? existing.attendance : "0",
          traits: existing ? existing.traits : JSON.stringify({}),
          comments: JSON.stringify(comments),
          promotion: existing ? existing.promotion : "",
          updatedAt: nowISO()
        };
        if (existing) {
          await db.update(reportExtras).set(data).where(eq(reportExtras.id, existing.id)).run();
        } else {
          await db.insert(reportExtras).values({
            id: generateId(),
            schoolId: session.schoolId,
            studentId: student.id,
            session: "",
            term: "",
            ...data,
            createdAt: nowISO()
          }).run();
        }
        successCount++;
      }
      result.reply = `Successfully generated AI report card comments for ${successCount} students in ${class_name}. You can review and manually override them under the Reports Broadsheet.`;
    }
    return jsonResponse(result, 200, origin);
  } catch (err) {
    console.error("AI Command Error:", err);
    return errorResponse(`Failed to process AI command: ${err.message}`, 500, origin);
  }
}
__name(handleAdminAICommand, "handleAdminAICommand");
__name2(handleAdminAICommand, "handleAdminAICommand");
async function handleSchoolBillingCheckout(db, request, session, origin) {
  const { plan } = await request.json();
  if (!plan) return errorResponse("Plan is required", 400, origin);
  const validPlans = ["BASIC", "PREMIUM", "ELITE"];
  if (!validPlans.includes(plan.toUpperCase())) {
    return errorResponse("Invalid plan", 400, origin);
  }
  const school = await db.select().from(schools).where(eq(schools.id, session.schoolId)).get();
  if (!school) return errorResponse("School not found", 404, origin);
  const user = await db.select().from(users).where(eq(users.id, school.ownerId)).get();
  if (!user) return errorResponse("School owner not found", 404, origin);
  let amountKobo = 0;
  if (plan.toUpperCase() === "BASIC") amountKobo = 25e5;
  else if (plan.toUpperCase() === "PREMIUM") amountKobo = 5e6;
  else if (plan.toUpperCase() === "ELITE") amountKobo = 1e7;
  const reference = `ref_${generateId()}`;
  await db.insert(payments).values({
    id: generateId(),
    schoolId: school.id,
    provider: "PAYSTACK",
    status: "PENDING",
    amountKobo,
    currency: "NGN",
    reference,
    metadata: JSON.stringify({ plan: plan.toUpperCase(), schoolId: school.id }),
    createdAt: nowISO(),
    updatedAt: nowISO()
  }).run();
  return jsonResponse({
    reference,
    amountKobo,
    email: user.email,
    schoolName: school.name
  }, 200, origin);
}
__name(handleSchoolBillingCheckout, "handleSchoolBillingCheckout");
__name2(handleSchoolBillingCheckout, "handleSchoolBillingCheckout");
async function handleSchoolBillingVerify(db, request, session, env, origin) {
  const { reference } = await request.json();
  if (!reference) return errorResponse("Reference is required", 400, origin);
  const payment = await db.select().from(payments).where(eq(payments.reference, reference)).get();
  if (!payment) return errorResponse("Payment record not found", 404, origin);
  if (payment.status === "SUCCESS") {
    return jsonResponse({ success: true, message: "Payment already verified", plan: JSON.parse(payment.metadata).plan }, 200, origin);
  }
  const paystackSecret = env.PAYSTACK_SECRET_KEY || "sk_test_mockkey123456789";
  let isVerified = false;
  let verifiedAmount = 0;
  if (paystackSecret && !paystackSecret.startsWith("sk_test_mock")) {
    try {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecret}`
        }
      });
      const data = await res.json();
      if (data?.status && data?.data?.status === "success") {
        isVerified = true;
        verifiedAmount = data.data.amount;
      }
    } catch (err) {
      console.error("Paystack verification error:", err);
    }
  } else {
    isVerified = true;
    verifiedAmount = payment.amountKobo;
  }
  if (!isVerified) {
    return errorResponse("Payment verification failed", 400, origin);
  }
  if (verifiedAmount !== payment.amountKobo) {
    return errorResponse("Payment amount mismatch", 400, origin);
  }
  const metadata = JSON.parse(payment.metadata);
  const plan = metadata.plan;
  await db.update(payments).set({
    status: "SUCCESS",
    updatedAt: nowISO()
  }).where(eq(payments.id, payment.id)).run();
  await db.update(schools).set({
    plan,
    trialEndsAt: null,
    // Clear trial limits
    updatedAt: nowISO()
  }).where(eq(schools.id, payment.schoolId)).run();
  try {
    const school = await db.select().from(schools).where(eq(schools.id, payment.schoolId)).get();
    if (school) {
      const owner = await db.select().from(users).where(eq(users.id, school.ownerId)).get();
      if (owner) {
        const mailer = new EmailService(env);
        await mailer.send({
          to: owner.email,
          subject: `Subscription Activated - ${school.name}`,
          html: EmailService.getPaymentSuccessTemplate(school.name, plan, (payment.amountKobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" }), reference)
        });
      }
    }
  } catch (err) {
    console.error("Success email sending failed:", err);
  }
  return jsonResponse({ success: true, plan }, 200, origin);
}
__name(handleSchoolBillingVerify, "handleSchoolBillingVerify");
__name2(handleSchoolBillingVerify, "handleSchoolBillingVerify");
async function onRequest2(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const publicPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/check-domain",
    "/api/auth/school-public",
    "/api/config",
    "/api/healthz",
    "/api/health"
  ];
  if (publicPaths.some((p) => url.pathname.startsWith(p))) {
    return next(request);
  }
  if (url.pathname.startsWith("/api/")) {
    const origin = request.headers.get("Origin") || "*";
    const authHeader = request.headers.get("Authorization");
    let token = null;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      const cookie = request.headers.get("Cookie") || "";
      const match2 = cookie.match(/(?:^|;\s*)token=([^;]*)/);
      if (match2) token = decodeURIComponent(match2[1]);
    }
    if (!token) {
      return new Response(JSON.stringify({ error: { message: "Authentication required" } }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true"
        }
      });
    }
    const session = await verifyToken(token, context.env.JWT_SECRET);
    if (!session) {
      return new Response(JSON.stringify({ error: { message: "Invalid or expired token" } }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true"
        }
      });
    }
    const newRequest = new Request(request, {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        "X-User-Id": session.userId,
        "X-User-Email": session.email,
        "X-User-Role": session.role,
        "X-School-Id": session.schoolId || ""
      })
    });
    return next(newRequest);
  }
  return next(request);
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
var routes = [
  {
    routePath: "/api/health",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/:route*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest2],
    modules: []
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode2 = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode2(value, key);
        });
      } else {
        params[key.name] = decode2(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode3 = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode3(token));
    } else {
      var prefix = escapeString(encode3(token.prefix));
      var suffix = escapeString(encode3(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-kP8hPR/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-kP8hPR/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.8298376364780342.js.map
