package com.agrovision.ai.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [ScanHistoryEntity::class, WeatherCacheEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AgroDatabase : RoomDatabase() {

    abstract fun agroDao(): AgroDao

    companion object {
        @Volatile
        private var INSTANCE: AgroDatabase? = null

        fun getInstance(context: Context): AgroDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AgroDatabase::class.java,
                    "agrovision_offline_db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
