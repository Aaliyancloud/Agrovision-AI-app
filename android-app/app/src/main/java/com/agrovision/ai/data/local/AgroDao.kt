package com.agrovision.ai.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface AgroDao {

    @Query("SELECT * FROM scan_history ORDER BY timestampMs DESC")
    fun observeAllScans(): Flow<List<ScanHistoryEntity>>

    @Query("SELECT * FROM scan_history WHERE id = :id LIMIT 1")
    suspend fun getScanById(id: String): ScanHistoryEntity?

    @Query(
        "SELECT * FROM scan_history " +
            "WHERE diseaseName LIKE '%' || :query || '%' " +
            "OR scientificName LIKE '%' || :query || '%' " +
            "OR source LIKE '%' || :query || '%' " +
            "ORDER BY timestampMs DESC"
    )
    fun searchScans(query: String): Flow<List<ScanHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScan(scan: ScanHistoryEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScans(scans: List<ScanHistoryEntity>)

    @Query("DELETE FROM scan_history WHERE id = :id")
    suspend fun deleteScanById(id: String)

    @Query("DELETE FROM scan_history")
    suspend fun clearAllScans()

    @Query("SELECT COUNT(*) FROM scan_history")
    suspend fun countScans(): Int

    @Query("SELECT * FROM weather_cache WHERE regionKey = :regionKey LIMIT 1")
    suspend fun getCachedWeather(regionKey: String): WeatherCacheEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertWeatherCache(cache: WeatherCacheEntity)
}
