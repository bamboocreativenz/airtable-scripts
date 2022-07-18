const settings = input.config({
  title: "Pull Base Metadata",
  description:
    "Gather information about each table and field and organize it in its own table for users to reference",
  items: [
    input.config.table("metadata_table", {
      label: "Metadata table",
      description: "Table to write info into",
    }),
    input.config.field("table_id_field", {
      parentTable: "metadata_table",
      label: "Table ID Field",
      description: "Field to write the table id into",
    }),
    input.config.field("table_name_field", {
      parentTable: "metadata_table",
      label: "Table Name Field",
      description: "Field to write the table name into",
    }),
    input.config.field("field_id_field", {
      parentTable: "metadata_table",
      label: "Field ID Field",
      description: "Field to write the field id into",
    }),
    input.config.field("field_name_field", {
      parentTable: "metadata_table",
      label: "Field Name Field",
      description: "Field to write the field name into",
    }),
    input.config.field("field_description_field", {
      parentTable: "metadata_table",
      label: "Field Description Field",
      description: "Field to write the field description into",
    }),
    input.config.field("field_type_field", {
      parentTable: "metadata_table",
      label: "Field Type Field",
      description: "Field to write the field type into",
    }),
    input.config.field("field_options_field", {
      parentTable: "metadata_table",
      label: "Field Options Name",
      description:
        "Field to write additional metadata into, such as single select options or linked record details",
    }),
  ],
});
// we can create a unique "key" for each field in the base which is the combination of table and field id
// this let's us search the existing metadata table to see if these records exist and if they do, update the existing entry
// otherwise, create a new one
function buildRecordKey(table_id, field_id) {
  return `${table_id}-${field_id}`;
}

// some fields have more data about them than others
// we can use this function to extract that information
// right now, this only pulls in single/multi select options and the table that a linked record links to
// but it could be expanded to also include details about formulas and other computed fields
function getFieldOptions(field) {
  if (field.type === "singleSelect" || field.type === "multipleSelects") {
    return field.options.choices
      .map((i) => {
        return i.name;
      })
      .join(", ");
  } else if (field.type === "multipleRecordLinks") {
    return base.getTable(field.options.linkedTableId).name;
  }
  return null;
}

// load records out of the table and build a map
// of existing records using their key
const results = await settings.metadata_table.selectRecordsAsync();
var existing_map = {};
for (let r of results.records) {
  let key = buildRecordKey(
    r.getCellValue(settings.table_id_field),
    r.getCellValue(settings.field_id_field)
  );
  existing_map[key] = r.id;
}
// filter out the metadata table from our search
const tables = base.tables.filter((t) => {
  return t.id !== settings.metadata_table.id;
});
// create two arrays to hold records to update versus records to create
var updates = [];
var creates = [];

// iterate through each table
for (let t of tables) {
  let fields = t.fields;
  for (let f of fields) {
    let key = buildRecordKey(t.id, f.id);

    let payload = {
      fields: {
        [settings.table_id_field.name]: t.id,
        [settings.table_name_field.name]: t.name,
        [settings.field_id_field.name]: f.id,
        [settings.field_name_field.name]: f.name,
        [settings.field_description_field.name]: f.description,
        [settings.field_type_field.name]: f.type,
        [settings.field_options_field.name]: getFieldOptions(f),
      },
    };
    if (existing_map[key] !== undefined) {
      let existing_id = existing_map[key];
      updates.push({
        id: existing_id,
        ...payload
      });
    } else {
      creates.push(payload);
    }
  }
}
// write data
output.markdown(`Updating ${updates.length} records`);
while (updates.length > 0) {
  await settings.metadata_table.updateRecordsAsync(updates.slice(0, 50));
  updates = updates.slice(50);
}
output.markdown(`Creating ${creates.length} records`);
while (creates.length > 0) {
  await settings.metadata_table.createRecordsAsync(creates.slice(0, 50));
  creates = creates.slice(50);
}
output.markdown("**Done**");
