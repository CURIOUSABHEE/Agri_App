import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ScienceIcon from '@mui/icons-material/Science';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BugReportIcon from '@mui/icons-material/BugReport';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 480 },
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 3,
    maxHeight: '80vh',
    overflowY: 'auto'
};

function getEventColor(type) {
    if (!type) return '#3788d8';
    type = type.toLowerCase();
    if (type.includes('soil')) return '#795548';
    if (type.includes('sow')) return '#43a047';
    if (type.includes('irrigation') || type.includes('water')) return '#0288d1';
    if (type.includes('fertiliz')) return '#7b1fa2';
    if (type.includes('harvest')) return '#e65100';
    if (type.includes('protect') || type.includes('pest')) return '#c62828';
    if (type.includes('storage')) return '#37474f';
    if (type.includes('monitoring')) return '#546e7a';
    return '#2e7d32';
}

const AnalysisCard = ({ icon, title, content, color, bgcolor }) => (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${color}22`, bgcolor }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ color }}>{icon}</Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color }}>{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{content}</Typography>
    </Paper>
);

const CalendarView = ({ plan, onSave, onNavigate }) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const events = plan?.schedule?.map(task => ({
        title: task.task_name,
        date: task.date,
        extendedProps: {
            description: task.description,
            resources: task.resources_needed,
            instructions: task.instructions,
            weather: task.weather_condition,
            type: task.task_type,
            deep_link: task.deep_link
        },
        backgroundColor: getEventColor(task.task_type),
        borderColor: getEventColor(task.task_type)
    })) || [];

    const handleEventClick = (clickInfo) => {
        setSelectedTask({
            title: clickInfo.event.title,
            date: clickInfo.event.startStr,
            ...clickInfo.event.extendedProps
        });
        setIsModalOpen(true);
    };

    const analysis = plan?.analysis || {};
    const hasBestPractices = plan?.best_practices && plan.best_practices.length > 0;

    return (
        <Box sx={{ bgcolor: '#f9fafb', p: { xs: 1, md: 2 }, borderRadius: 3 }}>

            {/* Activate Button */}
            {!plan?.plan_id && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={<AgricultureIcon />}
                        onClick={onSave}
                        sx={{ borderRadius: 2, px: 4, fontWeight: 'bold' }}
                    >
                        Activate This Plan
                    </Button>
                </Box>
            )}

            {/* Plan Summary Bar */}
            <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#1b5e20', color: 'white', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Crop</Typography>
                    <Typography variant="h6" fontWeight="bold">{plan?.crop_name}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Start Date</Typography>
                    <Typography variant="body1" fontWeight="bold">{plan?.start_date}</Typography>
                </Box>
                {plan?.yield_estimate && (
                    <>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                        <Box>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Expected Yield</Typography>
                            <Typography variant="body1" fontWeight="bold">🌾 {plan.yield_estimate}</Typography>
                        </Box>
                    </>
                )}
            </Paper>

            {/* AI Agronomist Analysis */}
            {Object.keys(analysis).length > 0 && (
                <Accordion defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, border: '1px solid #a5d6a7' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#e8f5e9', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="success.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            🧬 AI Agronomist Analysis
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            {analysis.climate_suitability && (
                                <Grid item xs={12} sm={6}>
                                    <AnalysisCard
                                        icon={<WbSunnyIcon />}
                                        title="Climate Suitability"
                                        content={analysis.climate_suitability}
                                        color="#f57c00"
                                        bgcolor="#fff8e1"
                                    />
                                </Grid>
                            )}
                            {analysis.soil_prep && (
                                <Grid item xs={12} sm={6}>
                                    <AnalysisCard
                                        icon={<EmojiNatureIcon />}
                                        title="Soil Preparation"
                                        content={analysis.soil_prep}
                                        color="#795548"
                                        bgcolor="#efebe9"
                                    />
                                </Grid>
                            )}
                            {analysis.manure_fertilizer && (
                                <Grid item xs={12} sm={6}>
                                    <AnalysisCard
                                        icon={<ScienceIcon />}
                                        title="Manure & Fertilizers"
                                        content={analysis.manure_fertilizer}
                                        color="#7b1fa2"
                                        bgcolor="#f3e5f5"
                                    />
                                </Grid>
                            )}
                            {analysis.water_management && (
                                <Grid item xs={12} sm={6}>
                                    <AnalysisCard
                                        icon={<WaterDropIcon />}
                                        title="Water Management"
                                        content={analysis.water_management}
                                        color="#0288d1"
                                        bgcolor="#e1f5fe"
                                    />
                                </Grid>
                            )}
                            {analysis.pest_disease && (
                                <Grid item xs={12}>
                                    <AnalysisCard
                                        icon={<BugReportIcon />}
                                        title="Pest & Disease Management"
                                        content={analysis.pest_disease}
                                        color="#c62828"
                                        bgcolor="#ffebee"
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Best Practices */}
            {hasBestPractices && (
                <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, border: '1px solid #b3e5fc' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#e1f5fe', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="info.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            ⭐ Best Practices for Maximum Yield
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                        <Grid container spacing={1}>
                            {plan.best_practices.map((tip, idx) => (
                                <Grid item xs={12} sm={6} key={idx}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 2, bgcolor: '#f0f9ff' }}>
                                        <CheckCircleOutlineIcon sx={{ color: '#0288d1', mt: 0.3, flexShrink: 0 }} fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">{tip}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Intercropping / Field Strategy */}
            {plan?.intercropping_strategy && plan.intercropping_strategy !== 'Error generating plan.' && (
                <Paper elevation={0} sx={{ mb: 2, p: 2, bgcolor: '#f1f8e9', borderRadius: 2, border: '1px solid #c5e1a5' }}>
                    <Typography variant="subtitle1" color="success.dark" fontWeight="bold" gutterBottom>
                        🌱 Field Strategy & Arrangement
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {plan.intercropping_strategy}
                    </Typography>
                </Paper>
            )}

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {[
                    { label: 'Soil Prep', color: '#795548' },
                    { label: 'Sowing', color: '#43a047' },
                    { label: 'Irrigation', color: '#0288d1' },
                    { label: 'Fertilizer', color: '#7b1fa2' },
                    { label: 'Harvest', color: '#e65100' },
                    { label: 'Protection', color: '#c62828' },
                    { label: 'Monitoring', color: '#546e7a' },
                ].map(({ label, color }) => (
                    <Chip
                        key={label}
                        label={label}
                        size="small"
                        sx={{ bgcolor: color + '22', color, border: `1px solid ${color}44`, fontWeight: 'bold', fontSize: '0.7rem' }}
                    />
                ))}
            </Box>

            {/* Calendar */}
            <Paper elevation={1} sx={{ p: 1, borderRadius: 2, height: '650px' }}>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    initialDate={plan?.start_date}
                    events={events}
                    eventClick={handleEventClick}
                    height="100%"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth'
                    }}
                    eventContent={(eventInfo) => (
                        <Box sx={{
                            p: '1px 4px',
                            borderRadius: 1,
                            overflow: 'hidden',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                        }}>
                            {eventInfo.event.title}
                        </Box>
                    )}
                />
            </Paper>

            {/* Task Detail Modal */}
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <Box sx={modalStyle}>
                    {selectedTask && (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Box sx={{
                                    width: 12, height: 12, borderRadius: '50%',
                                    bgcolor: getEventColor(selectedTask.type), flexShrink: 0
                                }} />
                                <Typography variant="h6" fontWeight="bold" color="success.dark">
                                    {selectedTask.title}
                                </Typography>
                            </Box>
                            <Chip
                                label={`📅 ${selectedTask.date}`}
                                size="small"
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />
                            <Divider sx={{ mb: 2 }} />

                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>📋 Description</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                                {selectedTask.description}
                            </Typography>

                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>📌 Instructions</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                                {selectedTask.instructions}
                            </Typography>

                            {selectedTask.resources && selectedTask.resources.length > 0 && (
                                <>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>🧰 Resources Needed</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                        {selectedTask.resources.map((res, idx) => (
                                            <Chip key={idx} label={res} size="small" color="success" variant="outlined" />
                                        ))}
                                    </Box>
                                </>
                            )}

                            {selectedTask.weather && (
                                <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 2, mb: 2 }}>
                                    <Typography variant="caption" color="primary" display="block">
                                        🌤️ Weather Forecast: {selectedTask.weather}
                                    </Typography>
                                </Box>
                            )}

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                {selectedTask.deep_link === 'rental' && (
                                    <Button variant="contained" color="warning" fullWidth onClick={() => { onNavigate('rental'); setIsModalOpen(false); }}>
                                        🚜 Rent Equipment
                                    </Button>
                                )}
                                {selectedTask.deep_link === 'market' && (
                                    <Button variant="contained" color="secondary" fullWidth onClick={() => { onNavigate('analytics'); setIsModalOpen(false); }}>
                                        📈 Check Market Prices
                                    </Button>
                                )}
                                {selectedTask.deep_link === 'schemes' && (
                                    <Button variant="contained" color="info" fullWidth onClick={() => { onNavigate('reports'); setIsModalOpen(false); }}>
                                        📋 View Govt Schemes
                                    </Button>
                                )}
                                {selectedTask.deep_link === 'disease_detection' && (
                                    <Button variant="contained" color="error" fullWidth onClick={() => { onNavigate('disease-detector'); setIsModalOpen(false); }}>
                                        🔍 Detect Disease / Pest
                                    </Button>
                                )}
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>
        </Box>
    );
};

export default CalendarView;
