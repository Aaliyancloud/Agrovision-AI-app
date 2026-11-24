package com.agrovision.ai.data.local

import androidx.room.TypeConverter
import org.json.JSONArray

class Converters {
    @TypeConverter
    fun fromStringList(value: List<String>?): String {
        if (value == null) return "[]"
        return JSONArray(value).toString()
    }

    @TypeConverter
    fun toStringList(serialized: String?): List<String> {
        if (serialized.isNullOrBlank()) return emptyList()
        return runCatching {
            val arr = JSONArray(serialized)
            List(arr.length()) { index -> arr.optString(index) }
        }.getOrDefault(emptyList())
    }
}
