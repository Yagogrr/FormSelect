(function () {
  // Definición de FormSelect.edit.display.js
  const FormSelectEditDisplay = [
    {
      type: "textfield",
      key: "label",
      label: "Label",
      input: true,
    },
    {
      type: "textfield",
      key: "placeholder",
      label: "Placeholder",
      input: true,
      defaultValue: "Select a form",
    },
  ];

  // Definición de FormSelect.form.js
  const selectEditForm = function (...extend) {
    return Formio.Components.baseEditForm(
      [
        {
          key: "data",
          components: [
            {
              type: "textfield",
              key: "dataUrl",
              label: "Data URL",
              input: true,
              placeholder: "http://localhost:3000/forms",
              defaultValue: "http://localhost:3000/forms",
            },
            {
              type: "textfield",
              key: "valueProperty",
              label: "Value Property",
              input: true,
              placeholder: "formId",
              defaultValue: "formId",
            },
            {
              type: "textfield",
              key: "searchField",
              label: "Search Field",
              input: true,
              placeholder: "formId",
              defaultValue: "formId",
            },
            {
              type: "textfield",
              key: "formContainer",
              label: "Form Container ID",
              input: true,
              placeholder: "formio",
              defaultValue: "formio",
              tooltip:
                "The ID of the HTML element where the selected form will be rendered",
            },
          ],
        },
        {
          key: "display",
          components: FormSelectEditDisplay,
        },
        {
          key: "validation",
          ignore: false,
        },
      ],
      ...extend
    );
  };

  // Definición de FormSelect.js
  const Field = Formio.Components.components.field;

  class FormSelect extends Field {
    static editForm = selectEditForm;

    static schema(...extend) {
      return Field.schema({
        type: "formselect",
        label: "Form Select",
        key: "formselect",
        placeholder: "Select a form",
        dataUrl: "http://localhost:3000/forms",
        valueProperty: "formId",
        searchField: "formId",
        formContainer: "formio",
      });
    }

    static get builderInfo() {
      return {
        title: "Form Select",
        icon: "list",
        group: "basic",
        weight: 0,
        schema: FormSelect.schema(),
      };
    }

    constructor(component, options, data) {
      super(component, options, data);
      this.forms = [];
      this.formInstance = null;
    }

    init() {
      super.init();
      this.loadForms();
    }

    loadForms() {
      fetch(this.component.dataUrl)
        .then((response) => response.json())
        .then((data) => {
          this.forms = data;
          if (this.refs.select) {
            this.populateOptions();
          }
        })
        .catch((error) => {
          console.error("Error loading forms:", error);
        });
    }

    get inputInfo() {
      const info = super.inputInfo;
      info.type = "select";
      info.attr.class = "form-control";
      info.attr.id = `${this.key}`;
      return info;
    }

    render(content) {
      return super.render(`
          <div ref="element">
            <select ref="select" class="form-control" id="${this.key}">
              <option value="">${this.component.placeholder}</option>
            </select>
          </div>
        `);
    }

    populateOptions() {
      if (!this.refs.select) return;

      // Clear existing options except for the placeholder
      while (this.refs.select.options.length > 1) {
        this.refs.select.remove(1);
      }

      // Add new options from forms data
      this.forms.forEach((form) => {
        const option = document.createElement("option");
        option.value = form[this.component.valueProperty];
        option.textContent = form[this.component.valueProperty];
        this.refs.select.appendChild(option);
      });

      // If we have a value, set it
      if (this.dataValue) {
        this.refs.select.value = this.dataValue;
      }
    }

    loadSelectedForm(formId) {
      // Buscar el formulario seleccionado
      const selectedForm = this.forms.find(
        (form) => form[this.component.valueProperty] === formId
      );

      if (!selectedForm) {
        console.error("Form not found with ID:", formId);
        return;
      }

      // Acceder a la definición del formulario
      const formDefinition = selectedForm.formDefinition;

      if (!formDefinition) {
        console.error("Form definition not found for form with ID:", formId);
        return;
      }

      // Obtener el contenedor del formulario
      const formContainer = document.getElementById(
        this.component.formContainer
      );

      if (!formContainer) {
        console.error(
          "Form container not found with ID:",
          this.component.formContainer
        );
        return;
      }

      // Limpiar el contenedor actual
      formContainer.innerHTML = "";

      // Crear la nueva instancia del formulario
      Formio.createForm(formContainer, formDefinition, {
        sanitizeConfig: {
          addTags: ["svg", "path"],
          addAttr: ["d", "viewBox"],
        },
      })
        .then((form) => {
          this.formInstance = form;
          console.log("Form loaded successfully", form);

          // Emitir un evento para notificar que el formulario ha sido cargado
          this.emit("formLoad", form);
        })
        .catch((error) => {
          console.error("Error loading form:", error);
        });
    }

    attach(element) {
      const result = super.attach(element);
      this.loadRefs(element, {
        select: "single",
      });

      if (this.refs.select) {
        this.addEventListener(this.refs.select, "change", () => {
          const value = this.refs.select.value;
          this.updateValue(value);

          if (value) {
            this.loadSelectedForm(value);
          }
        });

        this.populateOptions();
      }

      return result;
    }

    getValue() {
      return super.getValue();
    }

    setValue(value, flags = {}) {
      if (this.refs.select) {
        this.refs.select.value = value || "";

        if (value && !flags.noLoad) {
          this.loadSelectedForm(value);
        }
      }
      return super.setValue(value, flags);
    }
  }

  // Registrar el componente con Form.io
  Formio.use({
    components: {
      formselect: FormSelect,
    },
  });
})();
