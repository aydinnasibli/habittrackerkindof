// components/modals/habit-edit-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { IHabit } from "@/lib/types";
import { updateHabit } from "@/lib/actions/habits";

interface HabitEditModalProps {
    habit: IHabit | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function HabitEditModal({ habit, isOpen, onClose, onUpdate }: HabitEditModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        frequency: "",
        timeOfDay: "",
        timeToComplete: "",
        priority: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (habit) {
            setFormData({
                name: habit.name,
                description: habit.description,
                category: habit.category,
                frequency: habit.frequency,
                timeOfDay: habit.timeOfDay,
                timeToComplete: habit.timeToComplete,
                priority: habit.priority,
            });
        }
    }, [habit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!habit) return;

        setIsLoading(true);
        try {
            const result = await updateHabit(habit._id, formData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Habit updated successfully",
                });
                onUpdate();
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update habit",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!habit) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Habit</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Habit Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Enter habit name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Describe your habit"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mindfulness">🧘 Mindfulness</SelectItem>
                                    <SelectItem value="Health">💪 Health</SelectItem>
                                    <SelectItem value="Learning">📚 Learning</SelectItem>
                                    <SelectItem value="Productivity">⚡ Productivity</SelectItem>
                                    <SelectItem value="Digital Wellbeing">📱 Digital Wellbeing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">🔴 High</SelectItem>
                                    <SelectItem value="Medium">🟡 Medium</SelectItem>
                                    <SelectItem value="Low">🟢 Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select value={formData.frequency} onValueChange={(value) => handleChange("frequency", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Daily">Daily</SelectItem>
                                <SelectItem value="Weekdays">Weekdays</SelectItem>
                                <SelectItem value="Weekends">Weekends</SelectItem>
                                <SelectItem value="Mon, Wed, Fri">Mon, Wed, Fri</SelectItem>
                                <SelectItem value="Tue, Thu">Tue, Thu</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="timeOfDay">Time of Day</Label>
                            <Select value={formData.timeOfDay} onValueChange={(value) => handleChange("timeOfDay", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Morning">🌅 Morning</SelectItem>
                                    <SelectItem value="Afternoon">☀️ Afternoon</SelectItem>
                                    <SelectItem value="Evening">🌙 Evening</SelectItem>
                                    <SelectItem value="Throughout day">⏰ Throughout day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="timeToComplete">Duration</Label>
                            <Select value={formData.timeToComplete} onValueChange={(value) => handleChange("timeToComplete", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5 minutes">5 minutes</SelectItem>
                                    <SelectItem value="10 minutes">10 minutes</SelectItem>
                                    <SelectItem value="15 minutes">15 minutes</SelectItem>
                                    <SelectItem value="30 minutes">30 minutes</SelectItem>
                                    <SelectItem value="45 minutes">45 minutes</SelectItem>
                                    <SelectItem value="1 hour">1 hour</SelectItem>
                                    <SelectItem value="1+ hours">1+ hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Habit
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}