package com.agrovision.ai.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.agrovision.ai.model.ScanHistoryItem

@Entity(tableName = "scan_history")
data class ScanHistoryEntity(
    @PrimaryKey
    val id: String,
    val diseaseId: String,
    val diseaseName: String,
    val scientificName: String,
    val isTomatoLeaf: Boolean,
    val confidencePercent: Int,
    val severity: String,
    val summary: String,
    val organicSteps: List<String>,
    val source: String,
    val moistureSnapshot: Int,
    val phSnapshot: Float,
    val timestampMs: Long,
    val thumbnailPath: String? = null
) {
    fun toDomainModel(): ScanHistoryItem = ScanHistoryItem(
        id = id,
        diseaseId = diseaseId,
        diseaseName = diseaseName,
        scientificName = scientificName,
        isTomatoLeaf = isTomatoLeaf,
        confidencePercent = confidencePercent,
        severity = severity,
        summary = summary,
        organicSteps = organicSteps,
        source = source,
        moistureSnapshot = moistureSnapshot,
        phSnapshot = phSnapshot,
        timestampMs = timestampMs,
        thumbnailPath = thumbnailPath
    )

    companion object {
        fun fromDomainModel(item: ScanHistoryItem): ScanHistoryEntity = ScanHistoryEntity(
            id = item.id,
            diseaseId = item.diseaseId,
            diseaseName = item.diseaseName,
            scientificName = item.scientificName,
            isTomatoLeaf = item.isTomatoLeaf,
            confidencePercent = item.confidencePercent,
            severity = item.severity,
            summary = item.summary,
            organicSteps = item.organicSteps,
            source = item.source,
            moistureSnapshot = item.moistureSnapshot,
            phSnapshot = item.phSnapshot,
            timestampMs = item.timestampMs,
            thumbnailPath = item.thumbnailPath
        )
    }
}
