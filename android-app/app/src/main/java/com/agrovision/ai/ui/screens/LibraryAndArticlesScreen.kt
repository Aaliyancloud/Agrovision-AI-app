package com.agrovision.ai.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Article
import androidx.compose.material.icons.rounded.MenuBook
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agrovision.ai.data.AgroRepository
import com.agrovision.ai.model.AgroArticle
import com.agrovision.ai.model.ArticleCategory
import com.agrovision.ai.model.DiseaseGuide
import com.agrovision.ai.model.PathogenCategory
import com.agrovision.ai.ui.theme.AgroColors

private enum class LibraryTab { DISEASES, ARTICLES }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryAndArticlesScreen(
    onItemOpened: () -> Unit,
    modifier: Modifier = Modifier
) {
    var activeSubTab by remember { mutableStateOf(LibraryTab.DISEASES) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedPathogen by remember { mutableStateOf(PathogenCategory.ALL) }
    var selectedArticleCategory by remember { mutableStateOf(ArticleCategory.ALL) }
    var inspectedGuide by remember { mutableStateOf<DiseaseGuide?>(null) }
    var inspectedArticle by remember { mutableStateOf<AgroArticle?>(null) }

    Column(modifier = modifier.fillMaxSize()) {
        // Top Segmented Switcher: Disease Library | Articles & News
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = AgroColors.SurfaceMuted,
            border = BorderStroke(1.dp, AgroColors.Border),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Row(
                modifier = Modifier.padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                listOf(
                    LibraryTab.DISEASES to "Disease Library",
                    LibraryTab.ARTICLES to "Articles & News"
                ).forEach { (tab, label) ->
                    val selected = activeSubTab == tab
                    Surface(
                        onClick = { activeSubTab = tab },
                        shape = RoundedCornerShape(12.dp),
                        color = if (selected) AgroColors.ForestPrimary else Color.Transparent,
                        modifier = Modifier.weight(1f)
                    ) {
                        Row(
                            modifier = Modifier.padding(vertical = 10.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (tab == LibraryTab.DISEASES) Icons.Rounded.MenuBook else Icons.Rounded.Article,
                                contentDescription = null,
                                tint = if (selected) Color.White else AgroColors.TextSecondary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.size(6.dp))
                            Text(
                                text = label,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (selected) Color.White else AgroColors.TextSecondary,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }
                }
            }
        }

        AnimatedContent(
            targetState = activeSubTab,
            transitionSpec = {
                fadeIn(spring(stiffness = Spring.StiffnessMedium)) togetherWith
                    fadeOut(spring(stiffness = Spring.StiffnessMedium))
            },
            label = "libraryTabAnim"
        ) { currentTab ->
            if (currentTab == LibraryTab.DISEASES) {
                val filteredDiseases = remember(searchQuery, selectedPathogen) {
                    AgroRepository.DISEASE_LIBRARY.filter { guide ->
                        val catMatch = selectedPathogen == PathogenCategory.ALL || guide.category == selectedPathogen
                        val queryMatch = searchQuery.isBlank() ||
                            guide.name.contains(searchQuery, ignoreCase = true) ||
                            guide.scientificName.contains(searchQuery, ignoreCase = true) ||
                            guide.summary.contains(searchQuery, ignoreCase = true)
                        catMatch && queryMatch
                    }
                }

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 110.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                            placeholder = { Text("Search disease, pathogen, or symptom...", fontSize = 12.sp) },
                            singleLine = true,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            PathogenCategory.entries.forEach { cat ->
                                val active = selectedPathogen == cat
                                Surface(
                                    onClick = { selectedPathogen = cat },
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (active) AgroColors.ForestPrimary else AgroColors.Surface,
                                    border = BorderStroke(1.dp, if (active) AgroColors.ForestPrimary else AgroColors.Border)
                                ) {
                                    Text(
                                        text = cat.label,
                                        color = if (active) Color.White else AgroColors.TextSecondary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                                    )
                                }
                            }
                        }
                    }

                    items(filteredDiseases, key = { it.id }) { guide ->
                        DiseaseGuideCard(
                            guide = guide,
                            onClick = {
                                inspectedGuide = guide
                                onItemOpened()
                            }
                        )
                    }
                }
            } else {
                val filteredArticles = remember(selectedArticleCategory) {
                    AgroRepository.ARTICLES_AND_NEWS.filter { article ->
                        selectedArticleCategory == ArticleCategory.ALL ||
                            article.category == selectedArticleCategory
                    }
                }

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 110.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            ArticleCategory.entries.forEach { cat ->
                                val active = selectedArticleCategory == cat
                                Surface(
                                    onClick = { selectedArticleCategory = cat },
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (active) AgroColors.ForestPrimary else AgroColors.Surface,
                                    border = BorderStroke(1.dp, if (active) AgroColors.ForestPrimary else AgroColors.Border)
                                ) {
                                    Text(
                                        text = cat.label,
                                        color = if (active) Color.White else AgroColors.TextSecondary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                                    )
                                }
                            }
                        }
                    }

                    items(filteredArticles, key = { it.id }) { article ->
                        ArticleCard(
                            article = article,
                            onClick = {
                                inspectedArticle = article
                                onItemOpened()
                            }
                        )
                    }
                }
            }
        }
    }

    inspectedGuide?.let { guide ->
        ModalBottomSheet(
            onDismissRequest = { inspectedGuide = null },
            containerColor = AgroColors.Surface
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "${guide.category.label.uppercase()} · ${guide.severity.uppercase()} SEVERITY",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = AgroColors.ForestPrimary
                        )
                        Text(guide.name, style = MaterialTheme.typography.titleLarge, color = AgroColors.TextPrimary)
                        Text(
                            text = guide.scientificName,
                            fontStyle = FontStyle.Italic,
                            style = MaterialTheme.typography.bodySmall,
                            color = AgroColors.TextSecondary
                        )
                    }
                }
                item {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = AgroColors.SurfaceMuted,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Favorable Climate: ${guide.favorableClimate} · Contagion Risk: ${guide.contagionRisk}",
                            style = MaterialTheme.typography.labelMedium,
                            color = AgroColors.ForestDark,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }
                item {
                    Text(guide.summary, style = MaterialTheme.typography.bodyMedium, color = AgroColors.TextPrimary)
                }
                item {
                    SectionBulletList("Key Visual Symptoms", guide.keySymptoms)
                }
                item {
                    SectionBulletList("Organic Treatment Steps", guide.organicCare)
                }
                item {
                    SectionBulletList("Field Prevention", guide.preventionSteps)
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }

    inspectedArticle?.let { article ->
        ModalBottomSheet(
            onDismissRequest = { inspectedArticle = null },
            containerColor = AgroColors.Surface
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "${article.category.label.uppercase()} · ${article.regionTag} · ${article.publishedLabel}",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = AgroColors.TerracottaAction
                        )
                        Text(article.title, style = MaterialTheme.typography.titleLarge, color = AgroColors.TextPrimary)
                    }
                }
                items(article.bodyParagraphs) { paragraph ->
                    Text(paragraph, style = MaterialTheme.typography.bodyMedium, color = AgroColors.TextPrimary)
                }
                item {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = AgroColors.EmeraldSoft,
                        border = BorderStroke(1.dp, AgroColors.Border),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Field Action: ${article.actionTip}",
                            style = MaterialTheme.typography.labelMedium,
                            color = AgroColors.ForestDark,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
private fun DiseaseGuideCard(
    guide: DiseaseGuide,
    onClick: () -> Unit
) {
    val badgeColor = when (guide.severity) {
        "Severe" -> AgroColors.CrimsonAlert
        "Moderate" -> AgroColors.OchreWarm
        "Mild" -> AgroColors.RoyalBlue
        else -> AgroColors.ForestPrimary
    }

    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(18.dp),
        color = AgroColors.Surface,
        border = BorderStroke(1.dp, AgroColors.Border),
        shadowElevation = 1.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(guide.name, style = MaterialTheme.typography.titleSmall, color = AgroColors.TextPrimary)
                    Text(
                        text = "${guide.scientificName} · ${guide.category.label}",
                        fontStyle = FontStyle.Italic,
                        style = MaterialTheme.typography.labelSmall,
                        color = AgroColors.TextSecondary
                    )
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = badgeColor
                ) {
                    Text(
                        text = guide.severity,
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }
            Text(
                text = guide.summary,
                style = MaterialTheme.typography.bodySmall,
                color = AgroColors.TextSecondary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "Climate: ${guide.favorableClimate}",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = AgroColors.ForestPrimary
            )
        }
    }
}

@Composable
private fun ArticleCard(
    article: AgroArticle,
    onClick: () -> Unit
) {
    val tagColor = when (article.category) {
        ArticleCategory.DISEASE_ALERT -> AgroColors.CrimsonAlert
        ArticleCategory.LATEST_NEWS -> AgroColors.RoyalBlue
        else -> AgroColors.ForestPrimary
    }

    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(18.dp),
        color = AgroColors.Surface,
        border = BorderStroke(1.dp, AgroColors.Border),
        shadowElevation = 1.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(shape = RoundedCornerShape(8.dp), color = tagColor) {
                    Text(
                        text = article.category.label,
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
                Text(
                    text = "${article.publishedLabel} · ${article.readTimeLabel}",
                    style = MaterialTheme.typography.labelSmall,
                    color = AgroColors.TextSecondary
                )
            }
            Text(article.title, style = MaterialTheme.typography.titleSmall, color = AgroColors.TextPrimary)
            Text(
                text = article.summary,
                style = MaterialTheme.typography.bodySmall,
                color = AgroColors.TextSecondary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "Region: ${article.regionTag} · Tap to read full guide",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = AgroColors.ForestPrimary
            )
        }
    }
}

@Composable
private fun SectionBulletList(title: String, items: List<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, style = MaterialTheme.typography.titleSmall, color = AgroColors.ForestDark)
        items.forEach { entry ->
            Text("• $entry", style = MaterialTheme.typography.bodySmall, color = AgroColors.TextPrimary)
        }
    }
}
