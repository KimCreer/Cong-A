import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  StatusBar,
  Image,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import { Card, Button, Chip, Divider, Searchbar, Surface, IconButton, Menu, Provider as PaperProvider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

export default function UpdateScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [1, 0.96],
        extrapolate: 'clamp',
    });
    
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [130, 80],
        extrapolate: 'clamp',
    });

    const headerTitleSize = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [24, 20],
        extrapolate: 'clamp',
    });

    const [updates, setUpdates] = useState([
        { 
            id: 1, 
            title: "New Education Reform Bill Passed", 
            description: "A comprehensive education reform bill has been signed into law, focusing on modernizing curriculum and improving teacher resources.",
            longDescription: "The Education Reform Act of 2025 includes provisions for updated technology in classrooms, revised standardized testing metrics, and increased funding for teacher development programs. The bill passed with bipartisan support and is expected to be fully implemented by the start of the 2025-2026 school year.",
            date: "March 5, 2025",
            category: "legislation",
            source: "Department of Education",
            link: "https://education.gov/reform2025",
            urgent: false,
            image: "https://via.placeholder.com/150",
            interactions: 24,
            bookmarked: false
        },
        { 
            id: 2, 
            title: "Highway 101 Expansion Project", 
            description: "A major road-widening project on Highway 101 is set to begin in April, adding two lanes in each direction.",
            longDescription: "The Highway 101 Expansion Project aims to reduce traffic congestion by 30% during peak hours. Construction will take place primarily during night hours to minimize disruption. The project includes adding new lanes, improving on/off ramps, and implementing smart traffic management systems. Completion is expected by November 2025.",
            date: "March 3, 2025",
            category: "infrastructure",
            source: "Department of Transportation",
            link: "https://transportation.gov/highway101",
            urgent: true,
            image: "https://via.placeholder.com/150",
            interactions: 37,
            bookmarked: true
        },
        { 
            id: 3, 
            title: "Senior Wellness Initiative", 
            description: "Free medical check-ups and preventive care services now available for senior citizens aged 65 and above.",
            longDescription: "The Senior Wellness Initiative provides comprehensive health screenings, vaccinations, and preventive care consultations at no cost for eligible seniors. Services are available at all public hospitals and designated community health centers. Registration can be completed online or in person with proof of age and residency.",
            date: "February 28, 2025",
            category: "healthcare",
            source: "Department of Health",
            link: "https://health.gov/seniorwellness",
            urgent: false,
            image: "https://via.placeholder.com/150",
            interactions: 19,
            bookmarked: false
        },
        { 
            id: 4, 
            title: "Emergency Weather Alert System Update", 
            description: "A new mobile alert system for severe weather events has been deployed nationwide.",
            longDescription: "The updated Emergency Weather Alert System uses AI-powered predictive modeling to provide more accurate and timely warnings for hurricanes, tornadoes, floods, and other severe weather events. Citizens are encouraged to ensure their mobile devices have emergency alerts enabled and to download the official Weather Alert app for enhanced features.",
            date: "February 25, 2025",
            category: "safety",
            source: "National Weather Service",
            link: "https://weather.gov/alerts",
            urgent: true,
            image: "https://via.placeholder.com/150",
            interactions: 42,
            bookmarked: false
        },
        { 
            id: 5, 
            title: "Community Arts Festival", 
            description: "Annual arts and culture festival scheduled for April 15-18 at Central Park.",
            longDescription: "The Community Arts Festival will feature performances from local musicians, art exhibits, cultural food vendors, and interactive workshops for all ages. This year's theme is 'Unity Through Diversity' and will showcase artists from various cultural backgrounds. Entry is free, with some premium workshops requiring advance registration.",
            date: "February 20, 2025",
            category: "events",
            source: "Department of Cultural Affairs",
            link: "https://arts.gov/festival2025",
            urgent: false,
            image: "https://via.placeholder.com/150",
            interactions: 31,
            bookmarked: true
        },
    ]);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [expandedItem, setExpandedItem] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [visibleTooltip, setVisibleTooltip] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');
    
    // Animation states
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // Get unique categories for filter chips
    const categories = [...new Set(updates.map(update => update.category))];

    // Filter and sort updates
    const filteredUpdates = updates.filter(update => {
        const matchesSearch = update.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              update.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? update.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.date) - new Date(a.date);
        } else if (sortOrder === 'oldest') {
            return new Date(a.date) - new Date(b.date);
        } else if (sortOrder === 'popular') {
            return b.interactions - a.interactions;
        }
        return 0;
    });

    // Simulate fetching updates
    const fetchUpdates = () => {
        setLoading(true);
        // Reset animations
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.95);
        
        setTimeout(() => {
            setLoading(false);
            // Fade in animation
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                })
            ]).start();
        }, 1500);
    };

    // Pull to refresh functionality
    const onRefresh = () => {
        setRefreshing(true);
        fetchUpdates();
        setTimeout(() => {
            setRefreshing(false);
        }, 1500);
    };

    useEffect(() => {
        fetchUpdates();
    }, []);

    // Toggle bookmark
    const toggleBookmark = (id) => {
        if (Haptics && Haptics.impactAsync) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setUpdates(updates.map(update => 
            update.id === id ? {...update, bookmarked: !update.bookmarked} : update
        ));
    };

    // Handle expanding an item
    const handleExpand = (id) => {
        if (Haptics && Haptics.impactAsync) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setExpandedItem(expandedItem === id ? null : id);
    };

    // Handle opening external links
    const handleOpenLink = (url) => {
        if (Haptics && Haptics.impactAsync) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                console.log("Don't know how to open URI: " + url);
            }
        });
    };

    // Function to get category color
    const getCategoryColor = (category) => {
        const colors = {
            legislation: '#4361EE',
            infrastructure: '#F72585',
            healthcare: '#4CC9F0',
            safety: '#F94144',
            events: '#7209B7'
        };
        return colors[category] || '#888888';
    };

    // Get category background color (lighter)
    const getCategoryBgColor = (category) => {
        const colors = {
            legislation: 'rgba(67, 97, 238, 0.1)',
            infrastructure: 'rgba(247, 37, 133, 0.1)',
            healthcare: 'rgba(76, 201, 240, 0.1)',
            safety: 'rgba(249, 65, 68, 0.1)',
            events: 'rgba(114, 9, 183, 0.1)'
        };
        return colors[category] || 'rgba(136, 136, 136, 0.1)';
    };

    // Get category icon
    const getCategoryIcon = (category) => {
        const icons = {
            legislation: 'gavel',
            infrastructure: 'road',
            healthcare: 'heart-pulse',
            safety: 'shield-alert',
            events: 'calendar-star'
        };
        return icons[category] || 'information';
    };

    // Format date to be more readable
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short', 
                day: 'numeric'
            });
        }
    };

    return (
        <PaperProvider>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar barStyle="light-content" backgroundColor="#3A0CA3" translucent />
                
                {/* Animated Header Section with Gradient */}
                <Animated.View style={[styles.headerContainer, { height: headerHeight, opacity: headerOpacity }]}>
                    <LinearGradient
                        colors={['#4361EE', '#3A0CA3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.headerGradient}
                    >
                        <View style={styles.headerContent}>
                            <TouchableOpacity 
                                style={styles.menuButton}
                                onPress={() => navigation && navigation.goBack()}
                            >
                                <Icon name="menu" size={24} color="#ffffff" />
                            </TouchableOpacity>
                            
                            <Animated.Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>
                                Community Updates
                            </Animated.Text>
                            
                            <Menu
                                visible={menuVisible}
                                onDismiss={() => setMenuVisible(false)}
                                anchor={
                                    <TouchableOpacity 
                                        style={styles.settingsButton}
                                        onPress={() => {
                                            if (Haptics && Haptics.impactAsync) {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            }
                                            setMenuVisible(true);
                                        }}
                                    >
                                        <Icon name="dots-vertical" size={24} color="#ffffff" />
                                    </TouchableOpacity>
                                }
                            >
                                <Menu.Item 
                                    onPress={() => {
                                        setMenuVisible(false);
                                        setSortOrder('newest');
                                    }} 
                                    title="Sort by Newest" 
                                    leadingIcon="sort-calendar-descending"
                                />
                                <Menu.Item 
                                    onPress={() => {
                                        setMenuVisible(false);
                                        setSortOrder('oldest');
                                    }} 
                                    title="Sort by Oldest" 
                                    leadingIcon="sort-calendar-ascending"
                                />
                                <Menu.Item 
                                    onPress={() => {
                                        setMenuVisible(false);
                                        setSortOrder('popular');
                                    }} 
                                    title="Sort by Popular" 
                                    leadingIcon="trending-up"
                                />
                                <Divider />
                                <Menu.Item 
                                    onPress={() => {
                                        setMenuVisible(false);
                                        navigation && navigation.navigate('Settings');
                                    }} 
                                    title="Settings" 
                                    leadingIcon="cog"
                                />
                            </Menu>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Search Bar */}
                <Surface style={styles.searchBarContainer}>
                    <Searchbar
                        placeholder="Search updates..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        iconColor="#4361EE"
                        inputStyle={styles.searchInput}
                        placeholderTextColor="#A0AEC0"
                        onFocus={() => {
                            if (Haptics && Haptics.impactAsync) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                        }}
                        onClearIconPress={() => {
                            if (Haptics && Haptics.impactAsync) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setSearchQuery('');
                        }}
                    />
                </Surface>

                {/* Stats Bar */}
                <View style={styles.statsBar}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{updates.length}</Text>
                        <Text style={styles.statLabel}>Updates</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{updates.filter(u => u.urgent).length}</Text>
                        <Text style={styles.statLabel}>Urgent</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{updates.filter(u => u.bookmarked).length}</Text>
                        <Text style={styles.statLabel}>Saved</Text>
                    </View>
                </View>

                {/* Category Filters */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.categoryScroll}
                    contentContainerStyle={styles.categoryContainer}
                >
                    <Chip 
                        mode={selectedCategory === null ? "flat" : "outlined"}
                        selected={selectedCategory === null}
                        onPress={() => {
                            if (Haptics && Haptics.impactAsync) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setSelectedCategory(null);
                        }}
                        style={[styles.categoryChip, selectedCategory === null && styles.selectedChip]}
                        textStyle={selectedCategory === null ? styles.selectedChipText : styles.chipText}
                        elevation={selectedCategory === null ? 2 : 0}
                    >
                        All
                    </Chip>
                    {categories.map(category => (
                        <Chip 
                            key={category}
                            mode={selectedCategory === category ? "flat" : "outlined"}
                            selected={selectedCategory === category}
                            onPress={() => {
                                if (Haptics && Haptics.impactAsync) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                                setSelectedCategory(category);
                            }}
                            style={[
                                styles.categoryChip, 
                                { borderColor: getCategoryColor(category) },
                                selectedCategory === category && { backgroundColor: getCategoryColor(category) },
                                selectedCategory === category && { elevation: 2 }
                            ]}
                            textStyle={{ 
                                color: selectedCategory === category ? '#fff' : getCategoryColor(category),
                                fontWeight: selectedCategory === category ? 'bold' : 'normal'
                            }}
                            icon={() => <Icon name={getCategoryIcon(category)} size={16} color={selectedCategory === category ? '#fff' : getCategoryColor(category)} />}
                            elevation={selectedCategory === category ? 2 : 0}
                        >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Chip>
                    ))}
                </ScrollView>

                {/* Sort Indicator */}
                <View style={styles.sortIndicator}>
                    <Icon name={
                        sortOrder === 'newest' ? 'sort-calendar-descending' : 
                        sortOrder === 'oldest' ? 'sort-calendar-ascending' : 
                        'trending-up'
                    } size={14} color="#718096" />
                    <Text style={styles.sortText}>
                        Sorted by {
                            sortOrder === 'newest' ? 'newest first' : 
                            sortOrder === 'oldest' ? 'oldest first' : 
                            'popularity'
                        }
                    </Text>
                </View>

                {/* Updates List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4361EE" />
                        <Text style={styles.loadingText}>Loading updates...</Text>
                    </View>
                ) : (
                    <Animated.ScrollView 
                        style={styles.updateList} 
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#4361EE']}
                                tintColor="#4361EE"
                            />
                        }
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                    >
                        {filteredUpdates.length > 0 ? (
                            filteredUpdates.map((update) => (
                                <Animated.View 
                                    key={update.id}
                                    style={[
                                        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                                    ]}
                                >
                                    <Card 
                                        style={[
                                            styles.updateCard,
                                            update.urgent && styles.urgentCard
                                        ]}
                                    >
                                        <Card.Content style={styles.cardContent}>
                                            {/* Card Top Section with Category Tag and Date */}
                                            <View style={styles.cardHeader}>
                                                <View style={[
                                                    styles.categoryPill, 
                                                    { backgroundColor: getCategoryBgColor(update.category) }
                                                ]}>
                                                    <Icon 
                                                        name={getCategoryIcon(update.category)} 
                                                        size={14} 
                                                        color={getCategoryColor(update.category)} 
                                                    />
                                                    <Text style={[
                                                        styles.categoryPillText,
                                                        { color: getCategoryColor(update.category) }
                                                    ]}>
                                                        {update.category.charAt(0).toUpperCase() + update.category.slice(1)}
                                                    </Text>
                                                </View>
                                                
                                                <View style={styles.dateContainer}>
                                                    <Icon name="clock-outline" size={12} color="#718096" style={styles.dateIcon} />
                                                    <Text style={styles.updateDate}>{formatDate(update.date)}</Text>
                                                </View>
                                            </View>
                                            
                                            {/* Title and Bookmark/Important */}
                                            <View style={styles.titleContainer}>
                                                <Text style={styles.updateTitle}>{update.title}</Text>
                                                <View style={styles.titleActions}>
                                                    {update.urgent && (
                                                        <View style={styles.urgentBadge}>
                                                            <Icon name="alert" size={14} color="#ffffff" />
                                                        </View>
                                                    )}
                                                    <TouchableOpacity
                                                        style={styles.bookmarkButton}
                                                        onPress={() => toggleBookmark(update.id)}
                                                    >
                                                        <Icon 
                                                            name={update.bookmarked ? "bookmark" : "bookmark-outline"} 
                                                            size={20} 
                                                            color={update.bookmarked ? "#4361EE" : "#718096"} 
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            
                                            {/* Description */}
                                            <Text style={styles.updateDescription}>{update.description}</Text>
                                            
                                            {/* Expanded Content */}
                                            {expandedItem === update.id && (
                                                <View style={styles.expandedContent}>
                                                    <Divider style={styles.divider} />
                                                    <Text style={styles.longDescription}>{update.longDescription}</Text>
                                                    
                                                    <View style={styles.sourceContainer}>
                                                        <Icon name="information-outline" size={16} color="#718096" />
                                                        <Text style={styles.sourceText}>Source: {update.source}</Text>
                                                    </View>
                                                </View>
                                            )}
                                            
                                            {/* Card Actions */}
                                            <View style={styles.cardActions}>
                                                <View style={styles.interactionCounter}>
                                                    <Icon name="eye-outline" size={16} color="#718096" />
                                                    <Text style={styles.interactionText}>{update.interactions}</Text>
                                                </View>
                                                
                                                <View style={styles.actionButtons}>
                                                    <Button 
                                                        mode="text" 
                                                        onPress={() => handleExpand(update.id)}
                                                        style={styles.expandButton}
                                                        labelStyle={styles.expandButtonLabel}
                                                        icon={expandedItem === update.id ? "chevron-up" : "chevron-down"}
                                                    >
                                                        {expandedItem === update.id ? "Less" : "More"}
                                                    </Button>
                                                    
                                                    <Button 
                                                        mode="contained" 
                                                        onPress={() => handleOpenLink(update.link)}
                                                        style={styles.linkButton}
                                                        labelStyle={styles.linkButtonLabel}
                                                        icon="open-in-new"
                                                    >
                                                        View
                                                    </Button>
                                                </View>
                                            </View>
                                        </Card.Content>
                                    </Card>
                                </Animated.View>
                            ))
                        ) : (
                            <View style={styles.noResultsContainer}>
                                <Animated.View style={{ 
                                    opacity: fadeAnim, 
                                    transform: [{ scale: scaleAnim }]
                                }}>
                                    <Icon name="file-search-outline" size={60} color="#CBD5E0" />
                                    <Text style={styles.noResultsText}>No updates found</Text>
                                    <Text style={styles.noResultsSubtext}>Try changing your search or filters</Text>
                                    <Button 
                                        mode="outlined" 
                                        onPress={() => {
                                            if (Haptics && Haptics.impactAsync) {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            }
                                            setSearchQuery('');
                                            setSelectedCategory(null);
                                        }}
                                        style={styles.resetButton}
                                        labelStyle={styles.resetButtonLabel}
                                        icon="refresh"
                                    >
                                        Reset Filters
                                    </Button>
                                </Animated.View>
                            </View>
                        )}
                        
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Last updated: {new Date().toLocaleDateString()}
                            </Text>
                        </View>
                    </Animated.ScrollView>
                )}
                
                {/* Floating Action Button */}
                {!loading && (
                    <TouchableOpacity 
                        style={styles.fab}
                        onPress={() => {
                            if (Haptics && Haptics.impactAsync) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }
                            navigation && navigation.navigate('Notifications');
                        }}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#4361EE', '#3A0CA3']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.fabGradient}
                        >
                            <Icon name="bell-outline" size={24} color="#ffffff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7FAFC",
    },
    headerContainer: {
        width: '100%',
        paddingBottom: 40,
        overflow: 'hidden',
        zIndex: 10,
    },
    headerGradient: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    headerContent: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    menuButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTitle: {
        fontWeight: "bold",
        color: "#ffffff",
        textAlign: "center",
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    settingsButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    searchBarContainer: {
        marginHorizontal: 16,
        marginTop: -25,
        borderRadius: 20,
        elevation: 8,
        shadowColor: "rgba(0, 0, 0, 0.2)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        backgroundColor: '#fff',
        zIndex: 20,
    },
    searchBar: {
        elevation: 0,
        borderRadius: 20,
        backgroundColor: "#ffffff",
        height: 50,
    },
    searchInput: {
        fontSize: 14,
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    statLabel: {
        fontSize: 12,
        color: '#718096',
        marginTop: 4,
    },
    statDivider: {
        height: 24,
        width: 1,
        backgroundColor: '#E2E8F0',
    },
    categoryScroll: {
        maxHeight: 60,
        marginTop: 16,
    },
    categoryContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    categoryChip: {
        borderRadius: 20,
        marginRight: 8,
        height: 36,
        paddingHorizontal: 10,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    selectedChip: {
        backgroundColor: '#4361EE',
        borderColor: '#4361EE',
    },
    chipText: {
        fontSize: 12,
    },
    selectedChipText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    sortIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 4,
    },
    sortText: {
        fontSize: 12,
        color: '#718096',
        marginLeft: 4,
    },
    updateList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#718096',
        fontSize: 14,
    },
    updateCard: {
        marginVertical: 8,
        borderRadius: 16,
        overflow: 'hidden',
    },
    urgentCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#F94144',
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryPillText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        marginRight: 4,
    },
    updateDate: {
        fontSize: 12,
        color: '#718096',
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    updateTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3748',
        flex: 1,
        marginRight: 8,
    },
    titleActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    urgentBadge: {
        backgroundColor: '#F94144',
        borderRadius: 12,
        padding: 4,
        marginRight: 8,
    },
    bookmarkButton: {
        padding: 4,
    },
    updateDescription: {
        fontSize: 14,
        color: '#4A5568',
        lineHeight: 20,
    },
    expandedContent: {
        marginTop: 12,
    },
    divider: {
        marginVertical: 12,
    },
    longDescription: {
        fontSize: 14,
        color: '#4A5568',
        lineHeight: 22,
        marginBottom: 12,
    },
    sourceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: 'rgba(237, 242, 247, 0.8)',
        padding: 10,
        borderRadius: 8,
    },
    sourceText: {
        fontSize: 12,
        color: '#718096',
        marginLeft: 6,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    interactionCounter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    interactionText: {
        fontSize: 12,
        color: '#718096',
        marginLeft: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandButton: {
        marginRight: 8,
    },
    expandButtonLabel: {
        fontSize: 12,
        color: '#4361EE',
    },
    linkButton: {
        backgroundColor: '#4361EE',
        borderRadius: 8,
    },
    linkButtonLabel: {
        fontSize: 12,
        color: '#ffffff',
    },
    noResultsContainer: {
        flex: 1,
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noResultsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
        marginTop: 16,
        textAlign: 'center',
    },
    noResultsSubtext: {
        fontSize: 14,
        color: '#718096',
        marginTop: 8,
        textAlign: 'center',
    },
    resetButton: {
        marginTop: 20,
        borderColor: '#4361EE',
    },
    resetButtonLabel: {
        color: '#4361EE',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#A0AEC0',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#3A0CA3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltip: {
        backgroundColor: 'rgba(45, 55, 72, 0.9)',
        borderRadius: 8,
        padding: 10,
        width: 160,
    },
    tooltipText: {
        color: '#ffffff',
        fontSize: 12,
    },
    tooltipArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderStyle: 'solid',
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'rgba(45, 55, 72, 0.9)',
        position: 'absolute',
        top: -8,
        left: 20,
    },
    tooltipContainer: {
        position: 'absolute',
        zIndex: 100,
    },
    blurContainer: {
        overflow: 'hidden',
        borderRadius: 16,
    },
});