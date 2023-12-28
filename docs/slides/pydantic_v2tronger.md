---
theme: gaia
class: lead
paginate: true
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
footer: "@marcelotryle"
marp: true
style: |
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
---

# The validation evolution
# Pydantic V2tronger

---

# About me

![bg:40% 80%](assets/marcelo.png)

Marcelo Trylesinski

---

## FastAPI Expert

<img src="/assets/fastapi_expert.png" style="display: block; margin-left: auto; margin-right: auto; border-radius: 5px; width:80%" />

---

## OSS Maintainer

<div class="columns">
<div>

### Uvicorn

![w:450](https://raw.githubusercontent.com/tomchristie/uvicorn/master/docs/uvicorn.png)

</div>
<div>

### Starlette

![w:600](https://raw.githubusercontent.com/koddr/starlette-logo/master/src/dark/svg/starlette__full_logo__with_text__dark.svg)

<!-- Reference: https://github.com/koddr/starlette-logo -->

</div>
</div>

---

## Software Engineer at Pydantic

![w:900](assets/pydantic_company.png)

---

# What is Pydantic?

![w:900](assets/pydantic_basic.svg)

---

# What is Pydantic?

![w:900](assets/pydantic_works.svg)

---

# What's this talk about?

<!-- Explain that I'm going to go through some Pydantic features, and explain why/how they changed. -->

---

# Why did we create V2?

<!-- Explain why V2 was released. -->

---

# Pydantic Core


github.com/pydantic/pydantic-core

---

# Let's go through some changes

---

# `Config` -> `model_config`

![w:900](assets/pydantic_old_config.svg)

---

# `Config` -> `model_config`

![w:900](assets/pydantic_new_config.svg)

---

# Which settings changed?

<!-- Explain or show things that were deprecated/removed/changed on the `Config`. Explain also the reason for it. -->
![w:700](assets/renamed_fields.png)

---

# Changes on validators

## `@validator` -> `@field_validator`

![w:900](assets/old_validator.svg)

---

# Changes on validators

## `@validator` -> `@field_validator`

![w:900](assets/field_validator.svg)

---

# Validation mode (`before`)

![w:900](assets/before_mode.svg)

---

# Validation mode (`before`)

![w:900](assets/before_validator.svg)

---

# Validation mode (`wrap`)

![w:900](assets/wrap_validator.svg)

---

# Validation mode (`after`)

![w:900](assets/after_validator.svg)

---

# Changes on validators

## `@root_validator` -> `@model_validator`

---

# `__root__` -> `RootModel`

![w:700](assets/old_root.svg)

---

# `__root__` -> `RootModel`

![w:700](assets/new_root.svg)

---

# `TypeAdapter`

![w:900](assets/type_adapter.svg)

---

# `pydantic.BaseSettings` -> `pydantic_settings.BaseSettings`

github.com/pydantic/pydantic-settings

---

# Modify the JSON schema

![w:900](assets/modify_schema.svg)

---

# Modify the JSON schema

![w:900](assets/get_pydantic_json_schema.svg)

---

# Custom Types

<!-- This is the Pydantic protocol - other packages should implement this. -->
![w:900](assets/get_validators.svg)

---

# Custom Types

![w:900](assets/get_pydantic_core_schema.svg)

---

# Pydantic Extra Types

<!-- Uncertain policy to what gets in yet. Packages should be able to use the Pydantic protocol. -->
https://github.com/pydantic/pydantic-extra-types

---

# Performance Tips

<!-- Use the Pydantic documentation page to explain this one. -->
Use `model_validate_json()`, and not `model_validate(json.loads())`

![w:900](assets/model_validate_json.svg)

---

# Performance Tips

`TypeAdapter` instantiated once

![w:900](assets/bad_type_adapter.svg)

---

# Performance Tips

`TypeAdapter` instantiated once

![w:900](assets/good_type_adapter.svg)

---

# Performance Tips

Don't do validation when you don't have to - use `Any`

![w:900](assets/use_any.svg)

---

# Performance Tips

Use `Literal`, not `Enum`

---

# Performance Tips

Use `TypedDict` over nested models

---

# Performance Tips

https://docs.pydantic.dev/latest/concepts/performance

---

# Is V3 planned?

<!-- Explain that at some point next year we are going to have the next major. But... The changes are changes
are going to be far less disruptive in comparison to V1->V2. -->

---

# Where to see more about it?

https://docs.pydantic.dev/latest/migration/

---

# Early Access to our Product!

Talk to me to get my business card.

---

# Follow me on YouTube

The FastAPI Expert

---

# Thank You!

[FastAPIExpert.com](https://www.fastapiexpert.com)

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w==" crossorigin="anonymous" referrerpolicy="no-referrer" />


<i class="fab fa-linkedin"></i> Marcelo Trylesinski
<i class="fab fa-twitter"></i> @marcelotryle
<i class="fab fa-github"></i> Kludex
