#!/usr/bin/env bun
/**
 * i18n Validation Script
 *
 * Validates translation files for:
 * - Key completeness (all keys present in all locales)
 * - Structure consistency
 * - Placeholder consistency
 * - No missing translations
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface ValidationResult {
  locale: string;
  errors: string[];
  warnings: string[];
}

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

const LOCALES = ["en", "id"];
const MESSAGES_DIR = join(process.cwd(), "messages");

function loadTranslations(locale: string): TranslationObject {
  const filePath = join(MESSAGES_DIR, `${locale}.json`);
  if (!existsSync(filePath)) {
    throw new Error(`Translation file not found: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function flattenKeys(obj: TranslationObject, prefix = ""): Map<string, string> {
  const result = new Map<string, string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      result.set(fullKey, value);
    } else if (typeof value === "object" && value !== null) {
      const nested = flattenKeys(value, fullKey);
      for (const [nestedKey, nestedValue] of nested) {
        result.set(nestedKey, nestedValue);
      }
    }
  }

  return result;
}

function extractPlaceholders(text: string): string[] {
  const placeholders: string[] = [];
  const regex = /\{(\w+)\}/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint: need to use exec for global regex
  while ((match = regex.exec(text)) !== null) {
    placeholders.push(match[1]);
  }

  return placeholders;
}

function validateTranslations(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const translationsByLocale = new Map<string, Map<string, string>>();

  // Load all translations
  for (const locale of LOCALES) {
    try {
      const translations = loadTranslations(locale);
      translationsByLocale.set(locale, flattenKeys(translations));
    } catch (error) {
      results.push({
        locale,
        errors: [`Failed to load translations: ${error}`],
        warnings: [],
      });
    }
  }

  // Get reference keys from primary locale (id)
  const referenceKeys = translationsByLocale.get("id");
  if (!referenceKeys) {
    console.error("Failed to load reference locale (id)");
    process.exit(1);
  }

  // Validate each locale
  for (const locale of LOCALES) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const translations = translationsByLocale.get(locale);

    if (!translations) {
      continue; // Already reported error
    }

    // Check for missing keys
    for (const key of referenceKeys.keys()) {
      if (!translations.has(key)) {
        errors.push(`Missing translation key: ${key}`);
      }
    }

    // Check for extra keys (not in reference)
    for (const key of translations.keys()) {
      if (!referenceKeys.has(key)) {
        warnings.push(`Extra key not in reference locale: ${key}`);
      }
    }

    // Check placeholder consistency
    for (const [key, value] of translations) {
      const refValue = referenceKeys.get(key);
      if (!refValue) continue;

      const refPlaceholders = extractPlaceholders(refValue).sort();
      const translationPlaceholders = extractPlaceholders(value).sort();

      if (JSON.stringify(refPlaceholders) !== JSON.stringify(translationPlaceholders)) {
        errors.push(
          `Placeholder mismatch in key "${key}": ` +
            `expected [${refPlaceholders.join(", ")}], ` +
            `found [${translationPlaceholders.join(", ")}]`,
        );
      }

      // Check for empty translations
      if (value.trim() === "") {
        errors.push(`Empty translation for key: ${key}`);
      }
    }

    results.push({ locale, errors, warnings });
  }

  return results;
}

function main() {
  console.log("🔍 Validating i18n translations...\n");

  const results = validateTranslations();
  let hasErrors = false;

  for (const result of results) {
    console.log(`\n📝 Locale: ${result.locale}`);

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log("✅ All checks passed!");
      continue;
    }

    if (result.errors.length > 0) {
      hasErrors = true;
      console.log(`\n❌ Errors (${result.errors.length}):`);
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
      for (const warning of result.warnings) {
        console.log(`  - ${warning}`);
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);

  if (hasErrors) {
    console.log("❌ Validation failed with errors");
    process.exit(1);
  } else {
    console.log("✅ Validation passed!");
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
    if (totalWarnings > 0) {
      console.log(`⚠️  ${totalWarnings} warning(s) found`);
    }
  }
}

main();
