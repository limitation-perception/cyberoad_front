const API_URL = "http://127.0.0.1:8000";

const ENTITIES = {
    category: {
        path: "categories",
        title: "категорію",
        fields: [
            { name: "name", label: "Назва", type: "text", required: true },
            { name: "description", label: "Опис", type: "textarea" },
        ],
    },
    taskType: {
        path: "task-types",
        title: "тип завдання",
        fields: [
            { name: "name", label: "Назва", type: "text", required: true },
            { name: "description", label: "Опис", type: "textarea" },
        ],
    },
    resource: {
        path: "resources",
        title: "матеріал",
        fields: [
            { name: "title", label: "Назва", type: "text", required: true },
            { name: "url", label: "Посилання", type: "url", required: true },
            { name: "type", label: "Тип", type: "select", options: [["article", "Стаття"], ["video", "Відео"]] },
        ],
    },
};

const state = {
    categoryId: null,
    taskTypeId: null,
    editing: null,
};

function api(method, path, data) {
    return $.ajax({
        url: `${API_URL}/${path}`,
        method: method,
        contentType: "application/json",
        data: data ? JSON.stringify(data) : undefined,
    }).fail(showError);
}

function showError(xhr) {
    const $text = $("#error-text").empty();
    if (xhr.status === 0) {
        $text.text(
            `Не вдалося отримати відповідь від бекенду (${API_URL}). Перевірте, що сервер запущений ` +
            `і що фронт відкрито за адресою http://localhost:5173 (інакше запит блокує CORS).`,
        );
    } else {
        const body = xhr.responseJSON || {};
        $text.append($("<strong>").text(`${xhr.status}: ${body.detail || xhr.statusText}`));
        if (body.errors) {
            const $list = $("<ul>");
            $.each(body.errors, (field, messages) => {
                $list.append($("<li>").text(`${field}: ${messages.join(" ")}`));
            });
            $text.append($list);
        }
    }
    $("#error").prop("hidden", false);
}

function hideError() {
    $("#error").prop("hidden", true);
}

function renderList($list, items, emptyText, buildItem) {
    $list.empty();
    if (items.length === 0) {
        $list.append($("<li>").addClass("empty").text(emptyText));
        return;
    }
    items.forEach((item) => $list.append(buildItem(item)));
}

function buildItem(kind, item, $title, description, selected) {
    const $actions = $("<div>").addClass("item-actions").append(
        $("<button>").addClass("icon-btn").attr("title", "Редагувати").text("✎").on("click", (e) => {
            e.stopPropagation();
            openForm(kind, item);
        }),
        $("<button>").addClass("icon-btn").attr("title", "Видалити").text("✕").on("click", (e) => {
            e.stopPropagation();
            deleteItem(kind, item);
        }),
    );
    const $body = $("<div>").addClass("item-body").append($("<div>").addClass("item-title").append($title));
    if (description) {
        $body.append($("<div>").addClass("item-desc").text(description));
    }
    return $("<li>").addClass("item").toggleClass("selected", selected).append($body, $actions);
}

function loadCategories() {
    return api("GET", "categories").done((categories) => {
        renderList($("#categories"), categories, "Категорій ще немає", (category) =>
            buildItem("category", category, category.name, category.description, category.id === state.categoryId)
                .on("click", () => selectCategory(category.id)),
        );
    });
}

function loadTaskTypes() {
    return api("GET", `categories/${state.categoryId}/task-types`).done((taskTypes) => {
        renderList($("#task-types"), taskTypes, "У цій категорії ще немає типів завдань", (taskType) =>
            buildItem("taskType", taskType, taskType.name, taskType.description, taskType.id === state.taskTypeId)
                .on("click", () => selectTaskType(taskType.id)),
        );
    });
}

function loadResources() {
    return api("GET", `task-types/${state.taskTypeId}/resources`).done((resources) => {
        renderList($("#resources"), resources, "До цього типу завдання ще немає матеріалів", (resource) => {
            const $title = $("<span>").append(
                $("<span>").addClass(`badge ${resource.type}`).text(resource.type === "video" ? "відео" : "стаття"),
                $("<a>").attr({ href: resource.url, target: "_blank", rel: "noopener noreferrer" }).text(resource.title),
            );
            return buildItem("resource", resource, $title, null, false);
        });
    });
}

function selectCategory(id) {
    state.categoryId = id;
    state.taskTypeId = null;
    $('.add-btn[data-kind="taskType"]').prop("disabled", false);
    $('.add-btn[data-kind="resource"]').prop("disabled", true);
    $("#resources").html('<li class="empty">Оберіть тип завдання</li>');
    loadCategories();
    loadTaskTypes();
}

function selectTaskType(id) {
    state.taskTypeId = id;
    $('.add-btn[data-kind="resource"]').prop("disabled", false);
    loadTaskTypes();
    loadResources();
}

function reload(kind) {
    if (kind === "category") return loadCategories();
    if (kind === "taskType") return loadTaskTypes();
    return loadResources();
}

function openForm(kind, item) {
    const entity = ENTITIES[kind];
    state.editing = { kind, item };
    $("#form-title").text(`${item ? "Редагувати" : "Додати"} ${entity.title}`);

    const $fields = $("#form-fields").empty();
    entity.fields.forEach((field) => {
        let $input;
        if (field.type === "textarea") {
            $input = $("<textarea>").attr("rows", 3);
        } else if (field.type === "select") {
            $input = $("<select>");
            field.options.forEach(([value, label]) => $input.append($("<option>").val(value).text(label)));
        } else {
            $input = $("<input>").attr("type", field.type);
        }
        $input.attr("name", field.name).prop("required", Boolean(field.required));
        if (item) {
            $input.val(item[field.name]);
        }
        $fields.append($("<label>").addClass("field").append($("<span>").text(field.label), $input));
    });

    $("#form-dialog")[0].showModal();
}

function submitForm(event) {
    event.preventDefault();
    const { kind, item } = state.editing;
    const entity = ENTITIES[kind];

    const data = {};
    entity.fields.forEach((field) => {
        data[field.name] = $(`#form-fields [name="${field.name}"]`).val();
    });
    if (kind === "taskType") data.category = item ? item.category : state.categoryId;
    if (kind === "resource") data.task_type = item ? item.task_type : state.taskTypeId;

    const request = item
        ? api("PUT", `${entity.path}/${item.id}`, data)
        : api("POST", entity.path, data);

    request.done(() => {
        hideError();
        $("#form-dialog")[0].close();
        reload(kind);
    });
}

function deleteItem(kind, item) {
    const label = item.name || item.title;
    if (!confirm(`Видалити «${label}»?`)) return;

    api("DELETE", `${ENTITIES[kind].path}/${item.id}`).done(() => {
        hideError();
        if (kind === "category" && item.id === state.categoryId) {
            state.categoryId = null;
            state.taskTypeId = null;
            $(".add-btn[data-kind='taskType'], .add-btn[data-kind='resource']").prop("disabled", true);
            $("#task-types").html('<li class="empty">Оберіть категорію</li>');
            $("#resources").html('<li class="empty">Оберіть тип завдання</li>');
        }
        if (kind === "taskType" && item.id === state.taskTypeId) {
            state.taskTypeId = null;
            $(".add-btn[data-kind='resource']").prop("disabled", true);
            $("#resources").html('<li class="empty">Оберіть тип завдання</li>');
        }
        reload(kind);
    });
}

$(function () {
    $(".add-btn").on("click", function () {
        openForm($(this).data("kind"), null);
    });
    $("#form").on("submit", submitForm);
    $("#form-cancel").on("click", () => $("#form-dialog")[0].close());
    $("#error-close").on("click", hideError);

    loadCategories();
});
